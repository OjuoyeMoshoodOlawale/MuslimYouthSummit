import { query, transaction } from '../database/db.js';
import { success, error, notFound as notFoundRes } from '../utils/response.js';
import { generateQRCodeSVG } from '../services/qrcodeService.js';

/* ── Step 1: Validate ticket (scan) — returns info for attendant ─ */
export const checkIn = async (req, res, next) => {
  try {
    const { unique_number, event_id } = req.body;

    const [tickets] = await query(
      `SELECT t.id, t.status, t.unique_number,
              p.name, p.email, p.phone,
              tt.name AS ticket_type_name,
              c.name  AS category_name,
              a.checked_in_at, a.checked_out_at, a.id AS attendance_id,
              et.tag_number
       FROM tickets t
       JOIN participants p  ON p.id  = t.participant_id
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       LEFT JOIN event_categories c ON c.id = t.category_id
       LEFT JOIN attendance a   ON a.ticket_id = t.id AND a.event_id = ?
       LEFT JOIN event_tags et  ON et.id = a.tag_id
       WHERE t.unique_number = ? AND t.event_id = ?`,
      [event_id, unique_number, event_id]
    );

    if (!tickets.length) return error(res, `No ticket found: "${unique_number}"`, 404);
    const tk = tickets[0];

    if (tk.status !== 'paid')
      return error(res, `Ticket not valid (status: ${tk.status})`, 400);

    return success(res, {
      id: tk.id,
      unique_number:       tk.unique_number,
      participant_name:    tk.name,
      participant_email:   tk.email,
      participant_phone:   tk.phone,
      ticket_type_name:    tk.ticket_type_name,
      category_name:       tk.category_name,
      check_in_at:         tk.checked_in_at,
      check_out_at:        tk.checked_out_at,
      attendance_id:       tk.attendance_id,
      tag_number:          tk.tag_number,
    }, tk.checked_in_at ? '⚠️ Already checked in' : '✅ Valid ticket');
  } catch (e) { next(e); }
};

/* ── Step 2 (combined): Assign tag + complete check-in ──────── */
export const assignTagAndCheckIn = async (req, res, next) => {
  try {
    const { ticket_id, tag_number, event_id } = req.body;

    if (!ticket_id || !event_id)
      return error(res, 'ticket_id and event_id are required.', 400);

    /* Validate paid ticket */
    const [tickets] = await query(
      "SELECT id, participant_id, unique_number FROM tickets WHERE id = ? AND status = 'paid'",
      [ticket_id]
    );
    if (!tickets.length) return error(res, 'Invalid or unpaid ticket.', 404);
    const ticket = tickets[0];

    /* Check already checked in */
    const [existing] = await query(
      'SELECT id, checked_in_at FROM attendance WHERE ticket_id = ? AND event_id = ?',
      [ticket_id, event_id]
    );
    if (existing.length && existing[0].checked_in_at) {
      return error(res, '⚠️ This participant is already checked in.', 409);
    }

    let tagId = null;

    /* Handle tag assignment — auto-creates tag if scanned externally (barcode not pre-registered) */
    if (tag_number) {
      const tagNum = tag_number.toUpperCase().trim();
      let [tags] = await query(
        'SELECT id, ticket_id FROM event_tags WHERE tag_number = ? AND event_id = ?',
        [tagNum, event_id]
      );

      if (!tags.length) {
        // Tag scanned but not pre-generated — create it on the fly
        const qrSvg = await generateQRCodeSVG(`MYS-TAG:${tagNum}`).catch(() => null);
        const [ins] = await query(
          'INSERT INTO event_tags (event_id, tag_number, qr_code_svg) VALUES (?, ?, ?)',
          [event_id, tagNum, qrSvg]
        );
        tags = [{ id: ins.insertId, ticket_id: null }];
      }

      const tag = tags[0];
      if (tag.ticket_id && tag.ticket_id !== Number(ticket_id)) {
        return error(res, `Tag "${tagNum}" is already assigned to another participant.`, 409);
      }
      tagId = tag.id;

      await query(
        'UPDATE event_tags SET ticket_id=?, participant_id=?, assigned_at=NOW(), assigned_by=? WHERE id=?',
        [ticket_id, ticket.participant_id, req.admin?.id || null, tagId]
      );
    }

    /* Create/update attendance */
    if (existing.length) {
      await query(
        'UPDATE attendance SET tag_id=?, checked_in_at=NOW(), check_in_by=? WHERE id=?',
        [tagId, req.admin?.id || null, existing[0].id]
      );
    } else {
      await query(
        'INSERT INTO attendance (ticket_id, event_id, tag_id, checked_in_at, check_in_by) VALUES (?,?,?,NOW(),?)',
        [ticket_id, event_id, tagId, req.admin?.id || null]
      );
    }

    const tagMsg = tag_number ? ` Tag ${tag_number.toUpperCase()} assigned.` : '';
    return success(res, { tag_number, ticket_id },
      `✅ Check-in complete!${tagMsg}`);
  } catch (e) { next(e); }
};

/* ── Check Out ────────────────────────────────────────────── */
export const checkOut = async (req, res, next) => {
  try {
    const { ticket_id, attendance_id } = req.body;

    let attendance;
    if (attendance_id) {
      const [rows] = await query('SELECT * FROM attendance WHERE id=?', [attendance_id]);
      if (!rows.length) return error(res, 'Attendance record not found.', 404);
      attendance = rows[0];
    } else if (ticket_id) {
      const [rows] = await query(
        'SELECT * FROM attendance WHERE ticket_id=? ORDER BY checked_in_at DESC LIMIT 1',
        [ticket_id]
      );
      if (!rows.length) return error(res, 'No check-in record found for this ticket.', 404);
      attendance = rows[0];
    } else {
      return error(res, 'Provide ticket_id or attendance_id.', 400);
    }

    if (!attendance.checked_in_at)
      return error(res, 'This participant has not been checked in.', 400);
    if (attendance.checked_out_at)
      return error(res, 'This participant has already been checked out.', 409);

    await query(
      'UPDATE attendance SET checked_out_at=NOW(), check_out_by=? WHERE id=?',
      [req.admin?.id || null, attendance.id]
    );

    return success(res, null, '✅ Check-out recorded.');
  } catch (e) { next(e); }
};

/* ── Live dashboard stats ─────────────────────────────────── */
export const liveAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const [[stats]] = await query(
      `SELECT COUNT(*) AS total_checked_in,
              SUM(checked_out_at IS NOT NULL) AS checked_out,
              SUM(checked_out_at IS NULL)     AS currently_inside
       FROM attendance WHERE event_id=? AND checked_in_at IS NOT NULL`,
      [eventId]
    );

    const [[ticketStats]] = await query(
      "SELECT COUNT(*) AS total_registered FROM tickets WHERE event_id=? AND status='paid'",
      [eventId]
    );

    const [recent] = await query(
      `SELECT a.checked_in_at, p.name, t.unique_number,
              et.tag_number, tt.name AS ticket_type, c.name AS category
       FROM attendance a
       JOIN tickets t      ON t.id  = a.ticket_id
       JOIN participants p ON p.id  = t.participant_id
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       LEFT JOIN event_tags et       ON et.id = a.tag_id
       LEFT JOIN event_categories c  ON c.id  = t.category_id
       WHERE a.event_id=? AND a.checked_in_at IS NOT NULL
       ORDER BY a.checked_in_at DESC LIMIT 10`,
      [eventId]
    );

    return success(res, {
      total_registered: ticketStats.total_registered,
      checked_in:       stats.total_checked_in || 0,
      checked_out:      stats.checked_out      || 0,
      on_premises:      stats.currently_inside || 0,
      recent,
    });
  } catch (e) { next(e); }
};

/* ── Full attendance report (paginated) ─────────────────────── */
export const attendanceReport = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = 'WHERE a.event_id = ?';
    const params = [eventId];

    if (search) {
      where += ' AND (p.name LIKE ? OR t.unique_number LIKE ? OR et.tag_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const [[{ total }]] = await query(
      `SELECT COUNT(*) AS total FROM attendance a
       JOIN tickets t ON t.id = a.ticket_id
       JOIN participants p ON p.id = t.participant_id
       LEFT JOIN event_tags et ON et.id = a.tag_id
       ${where}`,
      params
    );

    const [rows] = await query(
      `SELECT a.id AS attendance_id,
              a.checked_in_at  AS check_in_at,
              a.checked_out_at AS check_out_at,
              p.name, p.email,
              t.unique_number, tt.name AS ticket_type_name,
              et.tag_number,
              c.name AS category_name
       FROM attendance a
       JOIN tickets t       ON t.id  = a.ticket_id
       JOIN participants p  ON p.id  = t.participant_id
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       LEFT JOIN event_tags et      ON et.id = a.tag_id
       LEFT JOIN event_categories c ON c.id  = t.category_id
       ${where}
       ORDER BY a.checked_in_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const pageNum  = Number(page);
    const limitNum = Number(limit);
    const totalNum = Number(total);

    return res.status(200).json({
      success: true,
      message: 'Success',
      data: rows,
      pagination: {
        total:  totalNum,
        page:   pageNum,
        limit:  limitNum,
        pages:  Math.ceil(totalNum / limitNum),
        from:   offset + 1,
        to:     Math.min(offset + rows.length, totalNum),
      },
    });
  } catch (e) { next(e); }
};
