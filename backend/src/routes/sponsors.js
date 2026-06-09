import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/db.js';
import { success, created, error, notFound } from '../utils/response.js';

const router = express.Router();
const adm = [authenticate, authorize('super_admin', 'admin')];

/* ── Public: get sponsors for an event (or all global) ──────── */
router.get('/sponsors', async (req, res, next) => {
  try {
    const { event_id } = req.query;
    let where = 'WHERE s.is_active = 1';
    const params = [];
    if (event_id) {
      where += ' AND (s.event_id = ? OR s.event_id IS NULL)';
      params.push(event_id);
    }
    const [rows] = await query(
      `SELECT s.*, e.title AS event_title, e.edition
       FROM sponsors s LEFT JOIN events e ON e.id = s.event_id
       ${where}
       ORDER BY FIELD(s.tier,'title','gold','silver','bronze','media','partner'), s.sort_order, s.name`,
      params
    );
    success(res, rows);
  } catch (e) { next(e); }
});

/* ── Admin: list all ────────────────────────────────────────── */
router.get('/sponsors/all', ...adm, async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT s.*, e.title AS event_title, e.edition
       FROM sponsors s LEFT JOIN events e ON e.id = s.event_id
       ORDER BY FIELD(s.tier,'title','gold','silver','bronze','media','partner'), s.sort_order`
    );
    success(res, rows);
  } catch (e) { next(e); }
});

/* ── Admin: create ──────────────────────────────────────────── */
router.post('/sponsors', ...adm, async (req, res, next) => {
  try {
    const { event_id, name, logo_url, website_url, tier, description, sort_order } = req.body;
    if (!name?.trim()) return error(res, 'Sponsor name is required.', 400);
    const [r] = await query(
      `INSERT INTO sponsors (event_id, name, logo_url, website_url, tier, description, sort_order)
       VALUES (?,?,?,?,?,?,?)`,
      [event_id || null, name.trim(), logo_url || null, website_url || null,
       tier || 'gold', description || null, sort_order ?? 0]
    );
    created(res, { id: r.insertId }, 'Sponsor added.');
  } catch (e) { next(e); }
});

/* ── Admin: update ──────────────────────────────────────────── */
router.put('/sponsors/:id', ...adm, async (req, res, next) => {
  try {
    const { event_id, name, logo_url, website_url, tier, description, sort_order, is_active } = req.body;
    await query(
      `UPDATE sponsors SET event_id=?, name=?, logo_url=?, website_url=?, tier=?,
         description=?, sort_order=?, is_active=? WHERE id=?`,
      [event_id || null, name, logo_url || null, website_url || null,
       tier || 'gold', description || null, sort_order ?? 0, is_active ? 1 : 0, req.params.id]
    );
    success(res, null, 'Sponsor updated.');
  } catch (e) { next(e); }
});

/* ── Admin: delete ──────────────────────────────────────────── */
router.delete('/sponsors/:id', ...adm, async (req, res, next) => {
  try {
    await query('DELETE FROM sponsors WHERE id=?', [req.params.id]);
    success(res, null, 'Sponsor deleted.');
  } catch (e) { next(e); }
});

export default router;
