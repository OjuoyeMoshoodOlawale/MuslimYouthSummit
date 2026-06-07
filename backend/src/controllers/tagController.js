import { query, transaction } from '../database/db.js';
import { success, created, error, notFound as notFoundRes } from '../utils/response.js';
import { generateQRCodeSVG, tagQRData } from '../services/qrcodeService.js';
import { generateTagNumber } from '../utils/helpers.js';

// ── Generate Tags for Event ───────────────────────────────────
export const generateTags = async (req, res, next) => {
  try {
    const { event_id, count } = req.body;

    if (!count || count < 1 || count > 500) {
      return error(res, 'Please specify a count between 1 and 500.');
    }

    const [events] = await query('SELECT id FROM events WHERE id = ?', [event_id]);
    if (!events.length) return notFoundRes(res, 'Event');

    // Get current max tag count for this event
    const [[{ currentCount }]] = await query(
      'SELECT COUNT(*) AS currentCount FROM event_tags WHERE event_id = ?',
      [event_id]
    );

    const tags = [];
    for (let i = 0; i < count; i++) {
      const sequence = currentCount + i + 1;
      const tagNumber = generateTagNumber(sequence);
      const qrData = tagQRData(tagNumber, event_id);
      const qrSvg = await generateQRCodeSVG(qrData);

      tags.push([event_id, tagNumber, qrSvg, qrData]);
    }

    await transaction(async (conn) => {
      for (const tag of tags) {
        await conn.execute(
          'INSERT INTO event_tags (event_id, tag_number, qr_code_svg, qr_code_data) VALUES (?, ?, ?, ?)',
          tag
        );
      }
    });

    return created(res, { generated: count, total: currentCount + count },
      `${count} event tag(s) generated successfully. Total for this event: ${currentCount + count}`
    );
  } catch (err) {
    next(err);
  }
};

// ── List Tags for Event ───────────────────────────────────────
export const listTags = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { assigned } = req.query;

    let sql = `
      SELECT et.*, p.name AS participant_name, t.unique_number AS ticket_number,
             a.name AS assigned_by_name
      FROM event_tags et
      LEFT JOIN participants p ON p.id = et.participant_id
      LEFT JOIN tickets t ON t.id = et.ticket_id
      LEFT JOIN admins a ON a.id = et.assigned_by
      WHERE et.event_id = ?
    `;
    const params = [eventId];

    if (assigned === 'true') { sql += ' AND et.ticket_id IS NOT NULL'; }
    if (assigned === 'false') { sql += ' AND et.ticket_id IS NULL'; }

    sql += ' ORDER BY et.id';

    const [rows] = await query(sql, params);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// ── Assign Tag to Ticket ──────────────────────────────────────
export const assignTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ticket_id } = req.body;

    const [tags] = await query('SELECT * FROM event_tags WHERE id = ?', [id]);
    if (!tags.length) return notFoundRes(res, 'Tag');

    const tag = tags[0];
    if (tag.ticket_id) {
      return error(res, 'This tag is already assigned to another participant.');
    }

    const [tickets] = await query(
      "SELECT id, participant_id FROM tickets WHERE id = ? AND status = 'paid'",
      [ticket_id]
    );
    if (!tickets.length) return error(res, 'Invalid or unpaid ticket.');

    await query(
      `UPDATE event_tags SET ticket_id = ?, participant_id = ?, assigned_at = NOW(), assigned_by = ? WHERE id = ?`,
      [ticket_id, tickets[0].participant_id, req.admin.id, id]
    );

    return success(res, null, `Tag ${tag.tag_number} assigned successfully.`);
  } catch (err) {
    next(err);
  }
};

// ── Get Printable Tags ────────────────────────────────────────
export const getPrintableTags = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const [events] = await query('SELECT title, edition FROM events WHERE id = ?', [eventId]);
    if (!events.length) return notFoundRes(res, 'Event');

    const [tags] = await query(
      `SELECT et.tag_number, et.qr_code_svg, et.qr_code_data,
              p.name AS participant_name, t.unique_number AS ticket_number
       FROM event_tags et
       LEFT JOIN participants p ON p.id = et.participant_id
       LEFT JOIN tickets t ON t.id = et.ticket_id
       WHERE et.event_id = ?
       ORDER BY et.id`,
      [eventId]
    );

    return success(res, { event: events[0], tags });
  } catch (err) {
    next(err);
  }
};

// ── Tag Stats ─────────────────────────────────────────────────
export const tagStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const [[stats]] = await query(
      `SELECT COUNT(*) AS total,
              SUM(ticket_id IS NOT NULL) AS assigned,
              SUM(ticket_id IS NULL) AS unassigned
       FROM event_tags WHERE event_id = ?`,
      [eventId]
    );

    return success(res, stats);
  } catch (err) {
    next(err);
  }
};
