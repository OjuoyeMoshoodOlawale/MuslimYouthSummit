import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/db.js';
import { success, created, error, notFound } from '../utils/response.js';
import { initializeTransaction, verifyTransaction } from '../services/paystackService.js';

const router = express.Router();
const adm    = [authenticate, authorize('super_admin', 'admin')];

/* ── Public: list active souvenirs ──────────────────────────── */
router.get('/souvenirs', async (req, res, next) => {
  try {
    const { event_id } = req.query;
    let where = 'WHERE s.is_active = 1';
    const params = [];
    if (event_id) {
      where += ' AND (s.event_id = ? OR s.event_id IS NULL)';
      params.push(event_id);
    }
    const [rows] = await query(
      `SELECT s.*,
              e.title AS event_title, e.edition,
              (s.available_qty IS NULL OR s.available_qty > s.sold_qty) AS in_stock
       FROM souvenirs s
       LEFT JOIN events e ON e.id = s.event_id
       ${where}
       ORDER BY s.sort_order, s.name`,
      params
    );
    success(res, rows);
  } catch (e) { next(e); }
});

/* ── Admin: list all (inc inactive) ────────────────────────── */
router.get('/souvenirs/all', ...adm, async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT s.*, e.title AS event_title, e.edition
       FROM souvenirs s LEFT JOIN events e ON e.id = s.event_id
       ORDER BY s.sort_order, s.name`
    );
    success(res, rows);
  } catch (e) { next(e); }
});

/* ── Admin: create souvenir ─────────────────────────────────── */
router.post('/souvenirs', ...adm, async (req, res, next) => {
  try {
    const { event_id, name, description, price, image_url, available_qty, sort_order } = req.body;
    if (!name?.trim())       return error(res, 'Name is required.', 400);
    if (!price || price < 0) return error(res, 'Valid price required.', 400);
    const [r] = await query(
      `INSERT INTO souvenirs (event_id, name, description, price, image_url, available_qty, sort_order)
       VALUES (?,?,?,?,?,?,?)`,
      [event_id || null, name.trim(), description || null, parseFloat(price),
       image_url || null, available_qty || null, sort_order ?? 0]
    );
    created(res, { id: r.insertId }, 'Souvenir created.');
  } catch (e) { next(e); }
});

/* ── Admin: update souvenir ─────────────────────────────────── */
router.put('/souvenirs/:id', ...adm, async (req, res, next) => {
  try {
    const { event_id, name, description, price, image_url, available_qty, sort_order, is_active } = req.body;
    await query(
      `UPDATE souvenirs SET event_id=?, name=?, description=?, price=?,
         image_url=?, available_qty=?, sort_order=?, is_active=? WHERE id=?`,
      [event_id || null, name, description || null, parseFloat(price),
       image_url || null, available_qty || null, sort_order ?? 0, is_active ? 1 : 0, req.params.id]
    );
    success(res, null, 'Souvenir updated.');
  } catch (e) { next(e); }
});

/* ── Admin: delete souvenir ─────────────────────────────────── */
router.delete('/souvenirs/:id', ...adm, async (req, res, next) => {
  try {
    const [[{ cnt }]] = await query(
      "SELECT COUNT(*) AS cnt FROM souvenir_orders WHERE souvenir_id=? AND status='paid'", [req.params.id]
    );
    if (cnt > 0) return error(res, `Cannot delete — ${cnt} paid order(s) exist. Deactivate instead.`, 409);
    await query('DELETE FROM souvenirs WHERE id=?', [req.params.id]);
    success(res, null, 'Souvenir deleted.');
  } catch (e) { next(e); }
});

/* ── Public: initiate souvenir purchase ─────────────────────── */
router.post('/souvenirs/:id/order', async (req, res, next) => {
  try {
    const { buyer_name, buyer_email, buyer_phone, quantity = 1, delivery_address, notes } = req.body;

    if (!buyer_name?.trim()) return error(res, 'Your name is required.', 400);
    if (!buyer_email?.trim() || !/\S+@\S+\.\S+/.test(buyer_email))
      return error(res, 'Valid email required.', 400);

    const [souvenirs] = await query(
      'SELECT * FROM souvenirs WHERE id=? AND is_active=1', [req.params.id]
    );
    if (!souvenirs.length) return notFound(res, 'Souvenir');
    const sv = souvenirs[0];

    // Stock check
    if (sv.available_qty !== null && sv.sold_qty + quantity > sv.available_qty)
      return error(res, `Only ${sv.available_qty - sv.sold_qty} item(s) left in stock.`, 409);

    const unit_price   = parseFloat(sv.price);
    const total_amount = unit_price * parseInt(quantity);
    const reference    = `SVN-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    // Create pending order
    const [r] = await query(
      `INSERT INTO souvenir_orders
         (souvenir_id, buyer_name, buyer_email, buyer_phone, quantity, unit_price,
          total_amount, status, paystack_reference, delivery_address, notes)
       VALUES (?,?,?,?,?,?,?,'pending',?,?,?)`,
      [sv.id, buyer_name.trim(), buyer_email.toLowerCase(), buyer_phone || null,
       parseInt(quantity), unit_price, total_amount, reference,
       delivery_address || null, notes || null]
    );

    // Initiate Paystack
    const payData = await initializeTransaction({
      email:        buyer_email.toLowerCase(),
      amount:       Math.round(total_amount * 100), // kobo
      reference,
      metadata:     { souvenir_id: sv.id, order_id: r.insertId, buyer_name, souvenir_name: sv.name, quantity },
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop/verify?ref=${reference}`,
    });

    created(res, {
      order_id:    r.insertId,
      reference,
      payment_url: payData.authorization_url,
      access_code: payData.access_code,
      total:       total_amount,
    }, `Order placed. Complete payment to confirm.`);
  } catch (e) { next(e); }
});

/* ── Public: verify souvenir payment ────────────────────────── */
router.get('/souvenirs/verify/:reference', async (req, res, next) => {
  try {
    const { reference } = req.params;
    const [orders] = await query(
      `SELECT o.*, s.name AS souvenir_name, s.available_qty, s.sold_qty
       FROM souvenir_orders o JOIN souvenirs s ON s.id = o.souvenir_id
       WHERE o.paystack_reference=?`, [reference]
    );
    if (!orders.length) return notFound(res, 'Order');
    const order = orders[0];
    if (order.status === 'paid') return success(res, order, 'Already confirmed.');

    const verData = await verifyTransaction(reference);
    if (verData.status !== 'success')
      return error(res, 'Payment not confirmed yet.', 402);

    // Mark paid
    await query(
      "UPDATE souvenir_orders SET status='paid', paid_at=NOW() WHERE paystack_reference=?", [reference]
    );
    await query('UPDATE souvenirs SET sold_qty=sold_qty+? WHERE id=?', [order.quantity, order.souvenir_id]);

    success(res, { ...order, status: 'paid' }, `Payment confirmed! Your order is being processed.`);
  } catch (e) { next(e); }
});

/* ── Admin: list all orders ─────────────────────────────────── */
router.get('/souvenir-orders', ...adm, async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = ''; const params = [];
    if (status) { where = 'WHERE o.status=?'; params.push(status); }
    const [rows] = await query(
      `SELECT o.*, s.name AS souvenir_name, s.price AS unit_price_current
       FROM souvenir_orders o JOIN souvenirs s ON s.id = o.souvenir_id
       ${where} ORDER BY o.created_at DESC`,
      params
    );
    success(res, rows);
  } catch (e) { next(e); }
});

/* ── Admin: mark order as delivered ─────────────────────────── */
router.patch('/souvenir-orders/:id/deliver', ...adm, async (req, res, next) => {
  try {
    await query("UPDATE souvenir_orders SET status='delivered' WHERE id=? AND status='paid'", [req.params.id]);
    success(res, null, 'Order marked as delivered.');
  } catch (e) { next(e); }
});

export default router;
