/**
 * scheduleController.js
 * Full CRUD for event schedule in tabular format:
 * S/N | Day | Time (from → to) | Lecture Title | Lecturer | Facilitators
 */
import { query, transaction } from '../database/db.js';
import { success, created, error, notFound } from '../utils/response.js';

/* ── GET full schedule ───────────────────────────────────────── */
export const getSchedule = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.params.id; // works from both routers
    const [rows] = await query(
      `SELECT
         l.id, l.s_n, l.event_day_id,
         d.day_number, d.event_date, d.theme AS day_theme,
         l.start_time, l.end_time,
         l.title, l.lecture_type,
         l.main_speaker_name, l.facilitators,
         l.description, l.sort_order,
         GROUP_CONCAT(s.name ORDER BY ls.sort_order SEPARATOR '||') AS speaker_names,
         GROUP_CONCAT(s.id  ORDER BY ls.sort_order SEPARATOR ',')  AS speaker_ids
       FROM lectures l
       LEFT JOIN event_days d ON d.id = l.event_day_id
       LEFT JOIN lecture_speakers ls ON ls.lecture_id = l.id
       LEFT JOIN speakers s ON s.id = ls.speaker_id
       WHERE l.event_id = ?
       GROUP BY l.id
       ORDER BY d.day_number, l.s_n, l.sort_order, l.start_time`,
      [eventId]
    );
    success(res, rows);
  } catch (e) { next(e); }
};

/* ── CREATE schedule entry ───────────────────────────────────── */
export const createEntry = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const {
      event_day_id, title, lecture_type,
      start_time, end_time,
      main_speaker_name, facilitators,
      description, speaker_ids = [],
    } = req.body;

    if (!title?.trim()) return error(res, 'Lecture title is required.', 400);

    // Auto s_n per event
    const [[{ maxSn }]] = await query(
      'SELECT COALESCE(MAX(s_n), 0) AS maxSn FROM lectures WHERE event_id=?', [eventId]
    );

    const [r] = await query(
      `INSERT INTO lectures
         (event_id, event_day_id, title, lecture_type,
          start_time, end_time, main_speaker_name, facilitators,
          description, s_n, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [eventId, event_day_id || null, title.trim(),
       lecture_type || 'lecture',
       start_time || null, end_time || null,
       main_speaker_name || null, facilitators || null,
       description || null, maxSn + 1, maxSn + 1]
    );

    const lectureId = r.insertId;

    // Link speakers if provided
    if (speaker_ids.length) {
      for (let i = 0; i < speaker_ids.length; i++) {
        await query(
          'INSERT IGNORE INTO lecture_speakers (lecture_id, speaker_id, sort_order) VALUES (?,?,?)',
          [lectureId, speaker_ids[i], i]
        );
      }
    }

    created(res, { id: lectureId }, 'Schedule entry added.');
  } catch (e) { next(e); }
};

/* ── UPDATE schedule entry ───────────────────────────────────── */
export const updateEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      event_day_id, title, lecture_type,
      start_time, end_time,
      main_speaker_name, facilitators,
      description, s_n, speaker_ids,
    } = req.body;

    await query(
      `UPDATE lectures SET
         event_day_id=?, title=?, lecture_type=?,
         start_time=?, end_time=?,
         main_speaker_name=?, facilitators=?,
         description=?, s_n=?, sort_order=?
       WHERE id=?`,
      [event_day_id || null, title, lecture_type || 'lecture',
       start_time || null, end_time || null,
       main_speaker_name || null, facilitators || null,
       description || null, s_n || 0, s_n || 0, id]
    );

    // Refresh speaker links
    if (speaker_ids !== undefined) {
      await query('DELETE FROM lecture_speakers WHERE lecture_id=?', [id]);
      for (let i = 0; i < speaker_ids.length; i++) {
        await query(
          'INSERT IGNORE INTO lecture_speakers (lecture_id, speaker_id, sort_order) VALUES (?,?,?)',
          [id, speaker_ids[i], i]
        );
      }
    }

    success(res, null, 'Schedule entry updated.');
  } catch (e) { next(e); }
};

/* ── DELETE schedule entry ───────────────────────────────────── */
export const deleteEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM lecture_speakers WHERE lecture_id=?', [id]);
    await query('DELETE FROM lectures WHERE id=?', [id]);
    success(res, null, 'Entry removed.');
  } catch (e) { next(e); }
};

/* ── REORDER (bulk update s_n) ───────────────────────────────── */
export const reorderSchedule = async (req, res, next) => {
  try {
    const { order } = req.body; // [{id, s_n}]
    for (const item of order) {
      await query('UPDATE lectures SET s_n=?, sort_order=? WHERE id=?',
        [item.s_n, item.s_n, item.id]);
    }
    success(res, null, 'Order saved.');
  } catch (e) { next(e); }
};

/* ── CLONE event schedule to new event ──────────────────────── */
export const cloneSchedule = async (req, res, next) => {
  try {
    // Support: POST /events/:eventId/schedule/clone → toEventId = params.eventId
    // Support: POST /events/schedule/clone          → fromEventId/toEventId in body
    const fromEventId = req.body.fromEventId;
    const toEventId   = req.body.toEventId || req.params.eventId;

    // Copy days (INSERT IGNORE — skip if day_number already exists in target event)
    const [days] = await query(
      'SELECT * FROM event_days WHERE event_id=? ORDER BY day_number', [fromEventId]
    );
    const dayMap = {};
    for (const d of days) {
      try {
        const [r] = await query(
          `INSERT IGNORE INTO event_days (event_id, day_number, event_date, theme, description)
           VALUES (?, ?, ?, ?, ?)`,
          [toEventId, d.day_number, d.event_date, d.theme, d.description]
        );
        if (r.insertId) {
          dayMap[d.id] = r.insertId;
        } else {
          // Day already existed — find its id in target
          const [existing] = await query(
            'SELECT id FROM event_days WHERE event_id=? AND day_number=?',
            [toEventId, d.day_number]
          );
          if (existing.length) dayMap[d.id] = existing[0].id;
        }
      } catch { /* skip duplicate */ }
    }

    // Copy lectures
    const [lectures] = await query(
      'SELECT * FROM lectures WHERE event_id=? ORDER BY s_n', [fromEventId]
    );
    for (const l of lectures) {
      const newDayId = l.event_day_id ? (dayMap[l.event_day_id] || null) : null;
      const [lr] = await query(
        `INSERT INTO lectures
           (event_id, event_day_id, title, lecture_type, start_time, end_time,
            main_speaker_name, facilitators, description, s_n, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [toEventId, newDayId, l.title, l.lecture_type, l.start_time, l.end_time,
         l.main_speaker_name, l.facilitators, l.description, l.s_n, l.sort_order]
      );
      // Copy speaker links
      const [lsRows] = await query(
        'SELECT * FROM lecture_speakers WHERE lecture_id=?', [l.id]
      );
      for (const ls of lsRows) {
        await query(
          'INSERT IGNORE INTO lecture_speakers (lecture_id, speaker_id, sort_order) VALUES (?,?,?)',
          [lr.insertId, ls.speaker_id, ls.sort_order]
        );
      }
    }

    success(res, null, `Schedule cloned from event ${fromEventId} to ${toEventId}.`);
  } catch (e) { next(e); }
};
