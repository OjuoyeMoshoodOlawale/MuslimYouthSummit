/**
 * Test routes — only for development/debugging
 * GET /api/test/email  → send a test email to yourself
 * GET /api/test/smtp   → verify SMTP config without sending
 */
import express from 'express';
import nodemailer from 'nodemailer';
import { authenticate, authorize } from '../middleware/auth.js';
import { success, error } from '../utils/response.js';
import { sendTicketEmail } from '../services/emailService.js';

const router = express.Router();
const adm    = [authenticate, authorize('super_admin', 'admin')];

/* ── Verify SMTP config (no email sent) ─────────────────── */
router.get('/test/smtp', ...adm, async (req, res) => {
  const cfg = {
    host:   process.env.SMTP_HOST,
    port:   process.env.SMTP_PORT,
    user:   process.env.SMTP_USER,
    pass:   process.env.SMTP_PASS ? '✅ set (' + process.env.SMTP_PASS.length + ' chars)' : '❌ NOT SET',
    from:   process.env.EMAIL_FROM,
  };

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return error(res, 'SMTP not configured. Check SMTP_HOST, SMTP_USER, SMTP_PASS in .env', 500);
  }

  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.verify();
    success(res, { ...cfg, status: '✅ SMTP connection verified — ready to send!' });
  } catch (err) {
    error(res, `SMTP connection failed: ${err.message}`, 500);
  }
});

/* ── Send a real test email ──────────────────────────────── */
router.post('/test/email', ...adm, async (req, res) => {
  const to = req.body.to || req.admin?.email || process.env.SMTP_USER;
  if (!to) return error(res, 'Provide { "to": "your@email.com" } in the request body', 400);

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return error(res, 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env', 500);
  }

  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: '✅ MYS Email Test — System is Working!',
      html: `
        <div style="font-family:sans-serif;max-width:500px;padding:32px;background:#FBF6E6">
          <div style="background:#02462E;color:white;padding:20px;text-align:center;margin-bottom:24px">
            <h1 style="margin:0;color:#FEC700">MYS</h1>
            <p style="margin:4px 0 0;opacity:.8;font-size:13px">Muslim Youth Summit</p>
          </div>
          <h2 style="color:#02462E">Email is Working!</h2>
          <p>This test email confirms your SMTP configuration is correct.</p>
          <table style="background:white;border:1px solid #ddd;padding:16px;width:100%;margin:16px 0">
            <tr><td style="color:#888;font-size:12px">From</td><td>${process.env.EMAIL_FROM || process.env.SMTP_USER}</td></tr>
            <tr><td style="color:#888;font-size:12px">To</td><td>${to}</td></tr>
            <tr><td style="color:#888;font-size:12px">SMTP</td><td>${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</td></tr>
            <tr><td style="color:#888;font-size:12px">Sent at</td><td>${new Date().toLocaleString('en-NG')}</td></tr>
          </table>
          <p style="color:#888;font-size:12px">Sent from MYS Platform backend</p>
        </div>`,
      text: `MYS Email Test\n\nYour SMTP is configured correctly!\nFrom: ${process.env.EMAIL_FROM}\nTo: ${to}\nTime: ${new Date().toISOString()}`,
    });

    success(res, {
      messageId: info.messageId,
      to,
      accepted:  info.accepted,
      response:  info.response,
    }, `Test email sent to ${to} — check your inbox!`);
  } catch (err) {
    error(res, `Email send failed: ${err.message}`, 500);
  }
});

/* ── Resend ticket email for a specific ticket ──────────── */
router.post('/test/resend-ticket', ...adm, async (req, res) => {
  const { unique_number } = req.body;
  if (!unique_number) return error(res, 'Provide { "unique_number": "MYS3-25-000001" }', 400);

  const { query } = await import('../database/db.js');
  const [rows] = await query(
    `SELECT t.*, p.name AS participant_name, p.email AS participant_email,
            e.title AS event_title, e.edition, e.start_date AS event_start_date,
            e.venue AS event_venue, tt.name AS ticket_type_name
     FROM tickets t
     JOIN participants p  ON p.id  = t.participant_id
     JOIN events e        ON e.id  = t.event_id
     JOIN ticket_types tt ON tt.id = t.ticket_type_id
     WHERE t.unique_number = ?`, [unique_number]
  );
  if (!rows.length) return error(res, `Ticket ${unique_number} not found`, 404);

  try {
    await sendTicketEmail(rows[0]);
    success(res, { to: rows[0].participant_email, ticket: unique_number },
      `Ticket email resent to ${rows[0].participant_email}`);
  } catch (err) {
    error(res, `Failed to send: ${err.message}`, 500);
  }
});

export default router;
