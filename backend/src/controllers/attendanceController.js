import { query, transaction } from '../database/db.js';
import { success, error, notFound as notFoundRes } from '../utils/response.js';

// ── Check In (scan ticket QR or enter number) ────────────────
export const checkIn = async (req, res, next) => {
  try {
    const { unique_number, event_id, day_id } = req.body;

    // Validate ticket
    const [tickets] = await query(
      `SELECT t.*, p.name, p.email, p.phone, tt.name AS ticket_type_name
       FROM tickets t
       JOIN participants p ON p.id = t.participant_id
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       WHERE t.unique_number = ? AND t.event_id = ?`,
      [unique_number, event_id]
    );

    if (!tickets.length) {
      return error(res, `❌ No ticket found with number "${unique_number}". Please verify the ticket.`, 404);
    }

    const ticket = tickets[0];

    if (ticket.status !== 'paid') {
      return error(res, `⚠️ This ticket is not valid (Status: ${ticket.status}). Payment may not be complete.`, 400);
    }

    // Check if already checked in for this day
    const dayCondition = day_id ? 'AND a.day_id = ?' : 'AND a.day_id IS NULL';
    const dayParam = day_id ? [day_id] : [];

    const [existing] = await query(
      `SELECT id, checked_in_at FROM attendance
       WHERE ticket_id = ? AND event_id = ? ${dayCondition}`,
      [ticket.id, event_id, ...dayParam]
    );

    if (existing.length && existing[0].checked_in_at) {
      const checkedInTime = new Date(existing[0].checked_in_at).toLocaleString('en-NG', {
        timeZone: 'Africa/Lagos',
      });
      return error(res, `⚠️ ${ticket.name} has already been checked in at ${checkedInTime}.`, 409);
    }

    return success(res, {
      ticket_id: ticket.id,
      unique_number: ticket.unique_number,
      participant_name: ticket.name,
      participant_email: ticket.email,
      participant_phone: ticket.phone,
      ticket_type: ticket.ticket_type_name,
      status: 'valid',
      ready_for_check_in: true,
    }, `✅ Valid ticket for ${ticket.name}. Assign a tag to complete check-in.`);
  } catch (err) {
    next(err);
  }
};

// ── Assign Tag & Complete Check-In ───────────────────────────
export const assignTagAndCheckIn = async (req, res, next) => {
  try {
    const { ticket_id, tag_number, event_id, day_id } = req.body;

    // Validate ticket
    const [tickets] = await query(
      "SELECT id, participant_id, unique_number FROM tickets WHERE id = ? AND status = 'paid'",
      [ticket_id]
    );
    if (!tickets.length) return error(res, 'Invalid ticket ID.', 404);

    const ticket = tickets[0];

    // Validate tag
    const [tags] = await query(
      'SELECT id, ticket_id FROM event_tags WHERE tag_number = ? AND event_id = ?',
      [tag_number, event_id]
    );

    if (!tags.length) {
      return error(res, `Tag "${tag_number}" was not found for this event. Please check the tag number.`, 404);
    }

    const tag = tags[0];

    if (tag.ticket_id) {
      // Check if it's assigned to someone else
      if (tag.ticket_id !== ticket_id) {
        return error(res, `⚠️ Tag "${tag_number}" is already assigned to another participant.`, 409);
      }
    }

    await transaction(async (conn) => {
      // Assign tag to ticket
      await conn.execute(
        `UPDATE event_tags SET ticket_id = ?, participant_id = ?, assigned_at = NOW(), assigned_by = ?
         WHERE id = ?`,
        [ticket_id, ticket.participant_id, req.admin?.id || null, tag.id]
      );

      // Create or update attendance record
      const dayCondition = day_id ? 'day_id = ?' : 'day_id IS NULL';
      const dayVal = day_id || null;

      const [existingAttendance] = await conn.execute(
        `SELECT id FROM attendance WHERE ticket_id = ? AND event_id = ? AND ${dayCondition}`,
        day_id ? [ticket_id, event_id, day_id] : [ticket_id, event_id]
      );

      if (existingAttendance[0].length) {
        await conn.execute(
          `UPDATE attendance SET tag_id = ?, checked_in_at = NOW(), check_in_by = ? WHERE id = ?`,
          [tag.id, req.admin?.id || null, existingAttendance[0][0].id]
        );
      } else {
        await conn.execute(
          `INSERT INTO attendance (ticket_id, event_id, day_id, tag_id, checked_in_at, check_in_by)
           VALUES (?, ?, ?, ?, NOW(), ?)`,
          [ticket_id, event_id, dayVal, tag.id, req.admin?.id || null]
        );
      }
    });

    return success(res, { tag_number, ticket_id }, `✅ Check-in complete! Tag ${tag_number} assigned.`);
  } catch (err) {
    next(err);
  }
};

// ── Check Out ────────────────────────────────────────────────
export const checkOut = async (req, res, next) => {
  try {
    const { ticket_id, event_id, day_id } = req.body;

    const dayCondition = day_id ? 'AND day_id = ?' : 'AND day_id IS NULL';
    const dayParam = day_id ? [day_id] : [];

    const [attendance] = await query(
      `SELECT id, checked_in_at, checked_out_at FROM attendance
       WHERE ticket_id = ? AND event_id = ? ${dayCondition}`,
      [ticket_id, event_id, ...dayParam]
    );

    if (!attendance.length || !attendance[0].checked_in_at) {
      return error(res, 'This participant has not been checked in.');
    }

    if (attendance[0].checked_out_at) {
      return error(res, 'This participant has already been checked out.');
    }

    await query(
      'UPDATE attendance SET checked_out_at = NOW(), check_out_by = ? WHERE id = ?',
      [req.admin?.id || null, attendance[0].id]
    );

    return success(res, null, '✅ Check-out recorded successfully.');
  } catch (err) {
    next(err);
  }
};

// ── Live Attendance Dashboard ─────────────────────────────────
export const liveAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const [[stats]] = await query(
      `SELECT
         COUNT(*) AS total_checked_in,
         SUM(checked_out_at IS NOT NULL) AS checked_out,
         SUM(checked_out_at IS NULL)     AS currently_inside
       FROM attendance WHERE event_id = ? AND checked_in_at IS NOT NULL`,
      [eventId]
    );

    const [[ticketStats]] = await query(
      "SELECT COUNT(*) AS total_registered FROM tickets WHERE event_id = ? AND status = 'paid'",
      [eventId]
    );

    const [recent] = await query(
      `SELECT a.checked_in_at, p.name, p.phone, et.tag_number, tt.name AS ticket_type,
              t.unique_number
       FROM attendance a
       JOIN tickets t ON t.id = a.ticket_id
       JOIN participants p ON p.id = t.participant_id
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       LEFT JOIN event_tags et ON et.id = a.tag_id
       WHERE a.event_id = ? AND a.checked_in_at IS NOT NULL
       ORDER BY a.checked_in_at DESC LIMIT 10`,
      [eventId]
    );

    return success(res, {
      total_registered:  ticketStats.total_registered,
      checked_in:        stats.total_checked_in || 0,   // AdminAttendance: live.checked_in
      checked_out:       stats.checked_out || 0,         // AdminAttendance: live.checked_out
      on_premises:       stats.currently_inside || 0,    // AdminAttendance: live.on_premises
      // Dashboard aliases
      total_checked_in:  stats.total_checked_in || 0,
      currently_inside:  stats.currently_inside || 0,
      recent:            recent,                          // Dashboard: aRes.data.data?.recent
      recent_check_ins:  recent,
    });
  } catch (err) {
    next(err);
  }
};

// ── Full Attendance Report ────────────────────────────────────
export const attendanceReport = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { day_id, search } = req.query;

    let sql = `
      SELECT a.id AS attendance_id, a.checked_in_at AS check_in_at, a.checked_out_at AS check_out_at,
             p.name, p.email, p.phone,
             t.unique_number, tt.name AS ticket_type,
             et.tag_number,
             ai.name AS checked_in_by_name
      FROM attendance a
      JOIN tickets t ON t.id = a.ticket_id
      JOIN participants p ON p.id = t.participant_id
      JOIN ticket_types tt ON tt.id = t.ticket_type_id
      LEFT JOIN event_tags et ON et.id = a.tag_id
      LEFT JOIN admins ai ON ai.id = a.check_in_by
      WHERE a.event_id = ?
    `;
    const params = [eventId];

    if (day_id) { sql += ' AND a.day_id = ?'; params.push(day_id); }
    if (search) {
      sql += ' AND (p.name LIKE ? OR t.unique_number LIKE ? OR et.tag_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY a.checked_in_at DESC';

    const [rows] = await query(sql, params);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};
