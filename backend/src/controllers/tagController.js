import { query, transaction } from '../database/db.js';
import { success, created, error, notFound as notFoundRes } from '../utils/response.js';
import { generateQRCodeSVG, tagQRData } from '../services/qrcodeService.js';
import { generateTagNumber } from '../utils/helpers.js';

/* ── Generate Tags for Event ──────────────────────────────── */
export const generateTags = async (req, res, next) => {
  try {
    const { event_id, count } = req.body;

    if (!count || count < 1 || count > 2000) {
      return error(res, 'Please specify a count between 1 and 2000.');
    }

    const [events] = await query('SELECT id FROM events WHERE id = ?', [event_id]);
    if (!events.length) return notFoundRes(res, 'Event');

    const [[{ currentCount }]] = await query(
      'SELECT COUNT(*) AS currentCount FROM event_tags WHERE event_id = ?',
      [event_id]
    );

    await transaction(async (conn) => {
      for (let i = 0; i < count; i++) {
        const sequence  = currentCount + i + 1;
        const tagNumber = generateTagNumber(sequence);
        const qrSvg     = await generateQRCodeSVG(tagQRData(tagNumber, event_id));
        await conn.execute(
          'INSERT INTO event_tags (event_id, tag_number, qr_code_svg) VALUES (?, ?, ?)',
          [event_id, tagNumber, qrSvg]
        );
      }
    });

    return created(res,
      { generated: count, total: currentCount + count },
      `${count} tag(s) generated. Total for this event: ${currentCount + count}`
    );
  } catch (err) { next(err); }
};

/* ── List Tags + Stats (combined) ─────────────────────────── */
export const listTags = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { assigned } = req.query;

    let sql = `
      SELECT et.id, et.tag_number, et.qr_code_svg, et.ticket_id,
             et.assigned_at, et.is_printed,
             p.name AS participant_name,
             t.unique_number AS ticket_unique_number
      FROM event_tags et
      LEFT JOIN participants p ON p.id = et.participant_id
      LEFT JOIN tickets t ON t.id = et.ticket_id
      WHERE et.event_id = ?
    `;
    const params = [eventId];

    if (assigned === 'true')  sql += ' AND et.ticket_id IS NOT NULL';
    if (assigned === 'false') sql += ' AND et.ticket_id IS NULL';
    sql += ' ORDER BY et.id';

    const [tags] = await query(sql, params);

    const [[stats]] = await query(
      `SELECT COUNT(*) AS total,
              SUM(ticket_id IS NOT NULL)  AS assigned,
              SUM(ticket_id IS NULL)      AS available
       FROM event_tags WHERE event_id = ?`,
      [eventId]
    );

    return success(res, { tags, stats });
  } catch (err) { next(err); }
};

/* ── Assign Tag to Ticket ─────────────────────────────────── */
export const assignTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ticket_id } = req.body;

    const [tags] = await query('SELECT * FROM event_tags WHERE id = ?', [id]);
    if (!tags.length) return notFoundRes(res, 'Tag');
    const tag = tags[0];

    if (tag.ticket_id && tag.ticket_id !== Number(ticket_id)) {
      return error(res, 'This tag is already assigned to another participant.', 409);
    }

    const [tickets] = await query(
      "SELECT id, participant_id FROM tickets WHERE id = ? AND status = 'paid'",
      [ticket_id]
    );
    if (!tickets.length) return error(res, 'Invalid or unpaid ticket.', 404);

    await query(
      `UPDATE event_tags
       SET ticket_id = ?, participant_id = ?, assigned_at = NOW(), assigned_by = ?
       WHERE id = ?`,
      [ticket_id, tickets[0].participant_id, req.admin?.id || null, id]
    );

    return success(res, { tag_number: tag.tag_number }, `Tag ${tag.tag_number} assigned.`);
  } catch (err) { next(err); }
};

/* ── Get Printable Tags ───────────────────────────────────── */
export const getPrintableTags = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const [events] = await query('SELECT title, edition FROM events WHERE id = ?', [eventId]);
    if (!events.length) return notFoundRes(res, 'Event');

    const [tags] = await query(
      `SELECT et.tag_number, et.qr_code_svg,
              p.name AS participant_name, t.unique_number AS ticket_number
       FROM event_tags et
       LEFT JOIN participants p ON p.id = et.participant_id
       LEFT JOIN tickets t ON t.id = et.ticket_id
       WHERE et.event_id = ? AND et.ticket_id IS NOT NULL
       ORDER BY et.tag_number`,
      [eventId]
    );

    return success(res, { event: events[0], tags });
  } catch (err) { next(err); }
};

/* ── Tag Stats (standalone) ───────────────────────────────── */
export const tagStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const [[stats]] = await query(
      `SELECT COUNT(*) AS total,
              SUM(ticket_id IS NOT NULL) AS assigned,
              SUM(ticket_id IS NULL)     AS available
       FROM event_tags WHERE event_id = ?`,
      [eventId]
    );
    return success(res, stats);
  } catch (err) { next(err); }
};
