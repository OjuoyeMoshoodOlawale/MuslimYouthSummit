import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/db.js';
import { success, created, error } from '../utils/response.js';
import { sendBulkCampaignEmails } from '../services/emailService.js';

const router = express.Router();
const adm = [authenticate, authorize('super_admin', 'admin')];

/* ── List campaigns ──────────────────────────────────────────── */
router.get('/campaigns', ...adm, async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT c.*, a.name AS created_by_name
       FROM email_campaigns c
       LEFT JOIN admins a ON a.id = c.created_by
       ORDER BY c.created_at DESC`
    );
    success(res, rows);
  } catch (e) { next(e); }
});

/* ── Create campaign draft ───────────────────────────────────── */
router.post('/campaigns', ...adm, async (req, res, next) => {
  try {
    const { event_id, subject, body_html, body_text, recipient_type } = req.body;
    if (!subject?.trim()) return error(res, 'Subject is required.', 400);
    if (!body_html?.trim()) return error(res, 'Email body is required.', 400);
    const [r] = await query(
      `INSERT INTO email_campaigns (event_id, subject, body_html, body_text, recipient_type, created_by)
       VALUES (?,?,?,?,?,?)`,
      [event_id || null, subject.trim(), body_html, body_text || null, recipient_type || 'all', req.admin.id]
    );
    created(res, { id: r.insertId }, 'Campaign saved as draft.');
  } catch (e) { next(e); }
});

/* ── Update draft ────────────────────────────────────────────── */
router.put('/campaigns/:id', ...adm, async (req, res, next) => {
  try {
    const { subject, body_html, body_text, recipient_type, event_id } = req.body;
    await query(
      `UPDATE email_campaigns
       SET subject=?, body_html=?, body_text=?, recipient_type=?, event_id=?
       WHERE id=? AND status='draft'`,
      [subject, body_html, body_text || null, recipient_type, event_id || null, req.params.id]
    );
    success(res, null, 'Campaign updated.');
  } catch (e) { next(e); }
});

/* ── Delete draft ────────────────────────────────────────────── */
router.delete('/campaigns/:id', ...adm, async (req, res, next) => {
  try {
    await query("DELETE FROM email_campaigns WHERE id=? AND status='draft'", [req.params.id]);
    success(res, null, 'Campaign deleted.');
  } catch (e) { next(e); }
});

/* ── Send campaign ───────────────────────────────────────────── */
router.post('/campaigns/:id/send', ...adm, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[campaign]] = await query(
      "SELECT * FROM email_campaigns WHERE id=? AND status='draft'", [id]
    );
    if (!campaign) return error(res, 'Campaign not found or already sent.', 404);

    // Get recipients
    let recipientsQuery =
      'SELECT DISTINCT p.name, p.email FROM participants p WHERE p.email_subscribed = 1';
    if (campaign.recipient_type === 'past_attendees') {
      recipientsQuery =
        `SELECT DISTINCT p.name, p.email FROM participants p
         JOIN tickets t ON t.participant_id = p.id
         WHERE t.status = 'paid' AND p.email_subscribed = 1`;
    }
    const [recipients] = await query(recipientsQuery);
    if (!recipients.length) return error(res, 'No subscribers found.', 400);

    // Mark as sending
    await query(
      `UPDATE email_campaigns SET status='sending', recipient_count=?, sent_at=NOW() WHERE id=?`,
      [recipients.length, id]
    );

    // Send in background (non-blocking response)
    res.json({ success: true, message: `Sending to ${recipients.length} recipients…`, data: { recipient_count: recipients.length } });

    // Background send
    sendBulkCampaignEmails(
      recipients,
      campaign.subject,
      campaign.body_html,
      async (result) => {
        await query(
          `UPDATE email_campaigns
           SET status=?, sent_count=sent_count+?, failed_count=failed_count+?
           WHERE id=?`,
          [result.failed ? 'sending' : 'sending', result.success ? 1 : 0, result.failed ? 1 : 0, id]
        );
      }
    ).then(async () => {
      await query("UPDATE email_campaigns SET status='sent' WHERE id=?", [id]);
    }).catch(async () => {
      await query("UPDATE email_campaigns SET status='failed' WHERE id=?", [id]);
    });
  } catch (e) { next(e); }
});

export default router;
