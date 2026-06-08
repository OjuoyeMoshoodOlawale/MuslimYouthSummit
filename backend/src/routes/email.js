import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query, transaction } from '../database/db.js';
import { success, created, error } from '../utils/response.js';
import { sendBulkCampaignEmails } from '../services/emailService.js';

const router = express.Router();

router.get('/campaigns', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const [rows] = await query(`
      SELECT ec.*, a.name AS created_by_name, e.title AS event_title
      FROM email_campaigns ec
      LEFT JOIN admins a ON a.id = ec.created_by
      LEFT JOIN events e ON e.id = ec.event_id
      ORDER BY ec.created_at DESC
    `);
    success(res, rows);
  } catch (err) { next(err); }
});

router.post('/campaigns', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { event_id, subject, body_html, body_text, recipient_type } = req.body;
    const [result] = await query(
      'INSERT INTO email_campaigns (event_id, subject, body_html, body_text, recipient_type, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [event_id || null, subject, body_html, body_text, recipient_type || 'all', req.admin.id]
    );
    created(res, { id: result.insertId }, 'Email campaign created.');
  } catch (err) { next(err); }
});

router.post('/campaigns/:id/send', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [campaigns] = await query("SELECT * FROM email_campaigns WHERE id = ? AND status = 'draft'", [id]);
    if (!campaigns.length) return error(res, 'Campaign not found or already sent.');

    const campaign = campaigns[0];

    // Get recipients
    let recipientsQuery = 'SELECT id, name, email FROM participants WHERE email_subscribed = 1';
    const params = [];
    if (campaign.recipient_type === 'past_attendees') {
      recipientsQuery = `SELECT DISTINCT p.id, p.name, p.email FROM participants p
        JOIN tickets t ON t.participant_id = p.id AND t.status = 'paid'
        WHERE p.email_subscribed = 1`;
    }

    const [recipients] = await query(recipientsQuery, params);
    if (!recipients.length) return error(res, 'No eligible recipients found.');

    await query("UPDATE email_campaigns SET status = 'sending', recipient_count = ? WHERE id = ?", [recipients.length, id]);

    // Send async (respond immediately)
    res.json({ success: true, message: `Sending to ${recipients.length} recipients. This may take a few minutes.`, data: { recipient_count: recipients.length } });

    // Actually send
    const { sent, failed, logs } = await sendBulkCampaignEmails(recipients, campaign.subject, campaign.body_html);

    await query("UPDATE email_campaigns SET status = 'sent', sent_count = ?, failed_count = ?, sent_at = NOW() WHERE id = ?", [sent, failed, id]);

    for (const log of logs) {
      await query('INSERT INTO email_logs (campaign_id, participant_id, email, status, error_message) VALUES (?, ?, ?, ?, ?)',
        [id, log.participantId || null, log.email, log.status, log.error || null]);
    }
  } catch (err) { next(err); }
});

export default router;

router.put('/campaigns/:id', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { subject, body_html, body_text, recipient_type, event_id } = req.body;
    await query("UPDATE email_campaigns SET subject=?, body_html=?, body_text=?, recipient_type=?, event_id=? WHERE id=? AND status='draft'",
      [subject, body_html, body_text||null, recipient_type, event_id||null, req.params.id]);
    success(res, null, 'Campaign updated.');
  } catch (err) { next(err); }
});

router.delete('/campaigns/:id', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    await query("DELETE FROM email_campaigns WHERE id=? AND status='draft'", [req.params.id]);
    success(res, null, 'Campaign deleted.');
  } catch (err) { next(err); }
});
