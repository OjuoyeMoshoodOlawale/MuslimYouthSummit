import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/db.js';
import { success, paginated, buildPagination } from '../utils/response.js';
import { parsePagination } from '../utils/helpers.js';

const router = express.Router();

router.get('/', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { search, subscribed } = req.query;
    let sql = 'SELECT * FROM participants WHERE 1=1';
    const params = [];
    if (search) { sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'; const s = `%${search}%`; params.push(s,s,s); }
    if (subscribed !== undefined) { sql += ' AND email_subscribed = ?'; params.push(subscribed === 'true' ? 1 : 0); }
    const [[{ total }]] = await query(`SELECT COUNT(*) AS total FROM participants WHERE 1=1${search ? ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)' : ''}${subscribed !== undefined ? ' AND email_subscribed = ?' : ''}`, params);
    const [rows] = await query(sql + ' ORDER BY created_at DESC LIMIT ? OFFSET ?', [...params, limit, offset]);
    paginated(res, rows, buildPagination(total, page, limit, rows.length));
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT p.*, 
        JSON_ARRAYAGG(JSON_OBJECT('event', e.title, 'ticket', t.unique_number, 'purchased_at', t.purchased_at)) AS event_history
       FROM participants p
       LEFT JOIN tickets t ON t.participant_id = p.id AND t.status = 'paid'
       LEFT JOIN events e ON e.id = t.event_id
       WHERE p.id = ? GROUP BY p.id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Participant not found.' });
    success(res, rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id/unsubscribe', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    await query('UPDATE participants SET email_subscribed = 0 WHERE id = ?', [req.params.id]);
    success(res, null, 'Participant unsubscribed from email communications.');
  } catch (err) { next(err); }
});

export default router;
