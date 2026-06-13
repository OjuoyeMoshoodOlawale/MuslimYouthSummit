import nodemailer from 'nodemailer';

/* ── Transporter ──────────────────────────────────────────── */
const createTransporter = () => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'Email not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to backend/.env\n' +
      'Gmail: use App Password from myaccount.google.com/apppasswords'
    );
  }
  return nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });
};

/* ── Brand ────────────────────────────────────────────────── */
const B = {
  green: '#02462E', gold: '#FEC700', cream: '#FBF6E6',
};

/* ── Base template ────────────────────────────────────────── */
const wrap = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%">
      <!-- Header -->
      <tr>
        <td style="background:${B.green};padding:28px 40px;text-align:center">
          <p style="color:${B.gold};font-size:10px;letter-spacing:3px;margin:0 0 6px;font-weight:700;text-transform:uppercase">
            Muslim Youth Summit
          </p>
          <h1 style="color:#ffffff;font-size:32px;margin:0;font-weight:900;letter-spacing:-1px">MYS</h1>
          <p style="color:${B.gold};font-size:12px;margin:6px 0 0;letter-spacing:1px">
            Islamic Youth Reformation &amp; Career Development
          </p>
        </td>
      </tr>
      <!-- Content -->
      <tr>
        <td style="padding:36px 40px">
          ${content}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:${B.cream};padding:20px 40px;text-align:center;border-top:1px solid #e0e0e0">
          <p style="color:#888;font-size:12px;margin:0">
            Muslim Youth Summit &bull; Lagos, Nigeria &bull;
            <a href="https://muslimyouthsummit.com" style="color:${B.green};text-decoration:none">
              muslimyouthsummit.com
            </a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

/* ── Core send function ───────────────────────────────────── */
const send = async ({ to, subject, html }) => {
  const t = createTransporter();
  // Note: verify() removed from here — it adds 300ms per email.
  // Use `node scripts/test-email.js` to verify SMTP config.
  const info = await t.sendMail({
    from:    process.env.EMAIL_FROM || `Muslim Youth Summit <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`  [Email] Sent to ${to} — MessageId: ${info.messageId}`);
  return info;
};

/* ══════════════════════════════════════════════════════════ */
/*  PUBLIC EXPORTS                                            */
/* ══════════════════════════════════════════════════════════ */

/** Test email — call from /api/email/test */
export const sendTestEmail = async (to) => {
  const html = wrap(`
    <h2 style="color:${B.green};font-size:22px;margin:0 0 12px">Email Test Successful!</h2>
    <p style="color:#555;font-size:15px;line-height:1.7">
      Assalamu Alaikum,<br/>
      Your MYS Platform email configuration is working correctly.
    </p>
    <div style="background:${B.cream};border-left:4px solid ${B.gold};padding:16px 20px;margin:24px 0">
      <p style="color:#333;font-size:14px;margin:0">
        <strong>SMTP Host:</strong> ${process.env.SMTP_HOST}<br/>
        <strong>From:</strong> ${process.env.EMAIL_FROM || process.env.SMTP_USER}<br/>
        <strong>To:</strong> ${to}
      </p>
    </div>
    <p style="color:#888;font-size:13px">
      Sent at: ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT
    </p>
  `);
  return send({ to, subject: 'MYS Platform — Email Test', html });
};

/** Ticket confirmation email */
export const sendTicketEmail = async (ticket) => {
  const dateStr = ticket.event_start_date
    ? new Date(ticket.event_start_date).toLocaleDateString('en-NG',
        { weekday:'long', day:'numeric', month:'long', year:'numeric' })
    : ticket.start_date || 'See event details';

  const qrBlock = ticket.qr_code_svg
    ? `<div style="text-align:center;margin:24px 0;padding:20px;background:${B.cream}">
        <p style="color:#666;font-size:13px;margin:0 0 12px;font-weight:600">Your Entry QR Code</p>
        <div style="display:inline-block">${ticket.qr_code_svg}</div>
        <p style="color:#999;font-size:11px;margin:12px 0 0">Present this at the event gate</p>
      </div>`
    : '';

  const html = wrap(`
    <h2 style="color:${B.green};font-size:22px;font-weight:800;margin:0 0 8px">
      Ticket Confirmed!
    </h2>
    <p style="color:#555;font-size:15px;margin:0 0 24px;line-height:1.7">
      Assalamu Alaikum <strong>${ticket.participant_name}</strong>,<br/>
      Your registration for <strong>${ticket.event_title}</strong> is confirmed.
      Barakallahu feek!
    </p>

    <!-- Ticket details -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:${B.green};border-radius:4px;padding:20px 24px;margin-bottom:24px">
      <tr>
        <td style="padding:8px 0">
          <p style="color:${B.gold};font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase">
            Ticket Number
          </p>
          <p style="color:#fff;font-size:20px;font-weight:900;margin:0;font-family:monospace;letter-spacing:2px">
            ${ticket.unique_number}
          </p>
        </td>
        <td style="padding:8px 0">
          <p style="color:${B.gold};font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase">
            Ticket Type
          </p>
          <p style="color:#fff;font-size:15px;font-weight:700;margin:0">
            ${ticket.ticket_type_name || 'General'}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0">
          <p style="color:${B.gold};font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase">
            Event Date
          </p>
          <p style="color:#fff;font-size:14px;margin:0">${dateStr}</p>
        </td>
        <td style="padding:8px 0">
          <p style="color:${B.gold};font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase">
            Venue
          </p>
          <p style="color:#fff;font-size:14px;margin:0">${ticket.event_venue || ticket.venue || 'See event details'}</p>
        </td>
      </tr>
      ${ticket.amount_paid ? `
      <tr>
        <td colspan="2" style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.2)">
          <p style="color:${B.gold};font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase">
            Amount Paid
          </p>
          <p style="color:#fff;font-size:15px;font-weight:700;margin:0">
            NGN ${Number(ticket.amount_paid).toLocaleString('en-NG')}
            ${Number(ticket.balance_due) > 0
              ? `<span style="color:#ffc107;font-size:13px;font-weight:400">
                  (Balance due: NGN ${Number(ticket.balance_due).toLocaleString('en-NG')} — payable at gate)
                </span>`
              : ''}
          </p>
        </td>
      </tr>` : ''}
    </table>

    ${qrBlock}

    <!-- Important info box -->
    <div style="background:#fff8e1;border:1px solid #ffc107;border-radius:4px;padding:16px 20px;margin-bottom:24px">
      <p style="color:#856404;font-size:13px;font-weight:700;margin:0 0 8px">Important</p>
      <ul style="color:#856404;font-size:13px;margin:0;padding-left:18px;line-height:1.8">
        <li>Show your QR code or ticket number <strong>${ticket.unique_number}</strong> at the gate</li>
        <li>Arrive at least 30 minutes before the programme starts</li>
        <li>Dress code: Modest Islamic attire</li>
        ${Number(ticket.balance_due) > 0
          ? `<li>Complete your balance payment of <strong>NGN ${Number(ticket.balance_due).toLocaleString('en-NG')}</strong> at the registration desk</li>`
          : ''}
      </ul>
    </div>

    <p style="color:#555;font-size:14px;margin:0;line-height:1.7">
      We look forward to seeing you at the event. May Allah bless the gathering and make it a means of benefit.
    </p>
    <p style="color:${B.green};font-size:14px;font-weight:700;margin:16px 0 0">
      Jazakallahu Khayran &mdash; The MYS Team
    </p>
  `);

  return send({
    to:      ticket.participant_email,
    subject: `Your MYS Ticket Confirmed: ${ticket.unique_number}`,
    html,
  });
};

/** Send a single campaign email */
export const sendCampaignEmail = async ({ to, subject, html }) => {
  return send({ to, subject, html });
};

/** Send bulk campaign emails with rate limiting */
export const sendBulkCampaignEmails = async (recipients, subject, bodyHtml, onProgress) => {
  const BATCH = 50;
  let sent = 0, failed = 0;
  const logs = [];

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    await Promise.allSettled(batch.map(async (r) => {
      try {
        await sendCampaignEmail({
          to:      r.email,
          subject,
          html:    bodyHtml.replace(/\{\{name\}\}/gi, r.name || 'Dear Friend'),
        });
        sent++;
        logs.push({ email: r.email, participantId: r.id, status: 'sent' });
      } catch (err) {
        failed++;
        logs.push({ email: r.email, participantId: r.id, status: 'failed', error: err.message });
        console.error(`  [Email] Failed to ${r.email}: ${err.message}`);
      }
    }));
    if (onProgress) onProgress({ sent, failed, total: recipients.length });
    if (i + BATCH < recipients.length) await new Promise(r => setTimeout(r, 2000));
  }
  return { sent, failed, logs };
};

/** Facilitator reminder email */
export const sendFacilitatorReminder = async ({ to, sessionTitle, startTime, eventTitle }) => {
  const html = wrap(`
    <h2 style="color:${B.green};font-size:20px;margin:0 0 12px">Session Reminder</h2>
    <p style="color:#555;font-size:15px;margin:0 0 20px">
      You are listed as a facilitator for the following session at <strong>${eventTitle}</strong>:
    </p>
    <div style="background:${B.cream};border-left:4px solid ${B.green};padding:16px 20px;margin:0 0 20px">
      <p style="font-size:16px;font-weight:700;color:${B.green};margin:0 0 4px">${sessionTitle}</p>
      <p style="font-size:14px;color:#666;margin:0">Start time: <strong>${startTime}</strong></p>
    </div>
    <p style="color:#555;font-size:14px">Please ensure you are ready 15 minutes before. Jazakallahu Khayran!</p>
  `);
  return send({ to, subject: `Facilitator Reminder: ${sessionTitle} — ${eventTitle}`, html });
};
