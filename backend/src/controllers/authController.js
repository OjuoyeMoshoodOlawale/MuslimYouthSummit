import bcrypt from 'bcrypt';
import { query } from '../database/db.js';
import { success, created, error, unauthorized, notFound as notFoundRes } from '../utils/response.js';
import { signToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

// ── Login ────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [rows] = await query(
      'SELECT * FROM admins WHERE email = ? AND is_active = 1',
      [email.trim().toLowerCase()]
    );

    if (!rows.length) {
      return error(res, 'Invalid email or password. Please try again.', 401);
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return error(res, 'Invalid email or password. Please try again.', 401);
    }

    // Update last login
    await query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = signToken(admin);

    return success(res, {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    }, 'Welcome back! You have been logged in successfully.');
  } catch (err) {
    next(err);
  }
};

// ── Get Current Admin ────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const [rows] = await query(
      'SELECT id, name, email, role, avatar, last_login, created_at FROM admins WHERE id = ?',
      [req.admin.id]
    );

    if (!rows.length) {
      return notFoundRes(res, 'Admin');
    }

    return success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

// ── Create Admin (super_admin only) ─────────────────────────
export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;

    const [existing] = await query('SELECT id FROM admins WHERE email = ?', [
      email.trim().toLowerCase(),
    ]);

    if (existing.length) {
      return error(res, 'An admin with this email already exists.', 409);
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [result] = await query(
      `INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), password_hash, role]
    );

    return created(res, {
      id: result.insertId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
    }, 'Admin account created successfully.');
  } catch (err) {
    next(err);
  }
};

// ── List Admins (super_admin only) ──────────────────────────
export const listAdmins = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT id, name, email, role, is_active, last_login, created_at
       FROM admins ORDER BY created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// ── Update Admin ─────────────────────────────────────────────
export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;

    const [existing] = await query('SELECT id FROM admins WHERE id = ?', [id]);
    if (!existing.length) return notFoundRes(res, 'Admin');

    await query(
      `UPDATE admins SET name = ?, email = ?, role = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, email?.toLowerCase(), role, is_active ? 1 : 0, id]
    );

    return success(res, null, 'Admin updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ── Change Password ──────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const [rows] = await query('SELECT password_hash FROM admins WHERE id = ?', [req.admin.id]);
    const match = await bcrypt.compare(current_password, rows[0].password_hash);

    if (!match) {
      return error(res, 'Current password is incorrect.', 400);
    }

    if (new_password.length < 8) {
      return error(res, 'New password must be at least 8 characters long.', 400);
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await query('UPDATE admins SET password_hash = ? WHERE id = ?', [newHash, req.admin.id]);

    return success(res, null, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
};
