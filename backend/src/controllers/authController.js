import bcrypt from 'bcrypt';
import { query } from '../database/db.js';
import { success, created, error, notFound as notFoundRes } from '../utils/response.js';
import { signToken } from '../middleware/auth.js';

/* ── Login ──────────────────────────────────────────────────── */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required.', 400);

    const [rows] = await query(
      'SELECT * FROM admins WHERE email = ? AND is_active = 1',
      [email.trim().toLowerCase()]
    );

    if (!rows.length) return error(res, 'Invalid email or password.', 401);

    const admin = rows[0];
    // Schema column is `password` (not password_hash)
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return error(res, 'Invalid email or password.', 401);

    await query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    return success(res, {
      token: signToken(admin),
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    }, 'Logged in successfully.');
  } catch (e) { next(e); }
};

/* ── Get current admin ──────────────────────────────────────── */
export const getMe = async (req, res, next) => {
  try {
    const [rows] = await query(
      'SELECT id, name, email, role, is_active, created_at FROM admins WHERE id = ?',
      [req.admin.id]
    );
    if (!rows.length) return notFoundRes(res, 'Admin');
    return success(res, rows[0]);
  } catch (e) { next(e); }
};

/* ── Create admin (super_admin only) ────────────────────────── */
export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return error(res, 'Name, email and password are required.', 400);
    if (password.length < 8)
      return error(res, 'Password must be at least 8 characters.', 400);
    if (!['super_admin','admin','attendant'].includes(role))
      return error(res, 'Invalid role.', 400);

    const [existing] = await query('SELECT id FROM admins WHERE email = ?',
      [email.trim().toLowerCase()]);
    if (existing.length) return error(res, 'An admin with this email already exists.', 409);

    const hash = await bcrypt.hash(password, 12);
    const [result] = await query(
      'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hash, role]
    );

    return created(res,
      { id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), role },
      'Admin account created.'
    );
  } catch (e) { next(e); }
};

/* ── List admins ────────────────────────────────────────────── */
export const listAdmins = async (req, res, next) => {
  try {
    const [rows] = await query(
      'SELECT id, name, email, role, is_active, created_at FROM admins ORDER BY role, name'
    );
    return success(res, rows);
  } catch (e) { next(e); }
};

/* ── Update admin ───────────────────────────────────────────── */
export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;
    const [existing] = await query('SELECT id FROM admins WHERE id = ?', [id]);
    if (!existing.length) return notFoundRes(res, 'Admin');

    await query(
      'UPDATE admins SET name=?, email=?, role=?, is_active=? WHERE id=?',
      [name, email?.toLowerCase(), role, is_active ? 1 : 0, id]
    );
    return success(res, null, 'Admin updated.');
  } catch (e) { next(e); }
};

/* ── Change password ────────────────────────────────────────── */
export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return error(res, 'Both current and new passwords are required.', 400);
    if (new_password.length < 8)
      return error(res, 'New password must be at least 8 characters.', 400);

    const [rows] = await query('SELECT password FROM admins WHERE id = ?', [req.admin.id]);
    if (!rows.length) return notFoundRes(res, 'Admin');

    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return error(res, 'Current password is incorrect.', 400);

    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE admins SET password = ? WHERE id = ?', [hash, req.admin.id]);
    return success(res, null, 'Password changed successfully.');
  } catch (e) { next(e); }
};
