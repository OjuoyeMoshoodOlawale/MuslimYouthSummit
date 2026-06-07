import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const MYS_BRAND = {
  primary: '#02462E',
  gold: '#FEC700',
  cream: '#FBF6E6',
  lightGreen: '#6BBC01',
};

const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Muslim Youth Summit</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:${MYS_BRAND.primary};padding:32px 40px;text-align:center;">
            <p style="color:${MYS_BRAND.gold};font-size:11px;letter-spacing:3px;margin:0 0 8px;font-weight:700;text-transform:uppercase;">Muslim Youth Summit</p>
            <h1 style="color:#ffffff;font-size:36px;margin:0;font-weight:900;letter-spacing:-1px;">MYS</h1>
            <p style="color:${MYS_BRAND.gold};font-size:13px;margin:8px 0 0;letter-spacing:1px;">Islamic Youth Reformation & Career Development</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:${MYS_BRAND.cream};padding:24px 40px;text-align:center;border-top:1px solid #e8e8e8;">
            <p style="color:#666;font-size:12px;margin:0 0 8px;">Muslim Youth Summit | Lagos, Nigeria</p>
            <p style="color:#999;font-size:11px;margin:0;">
              You received this email because you registered for a MYS event.<br/>
              <a href="{UNSUBSCRIBE_LINK}" style="color:${MYS_BRAND.primary};text-decoration:none;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

/**
 * Send ticket confirmation email
 */
export const sendTicketEmail = async (ticket) => {
  const transporter = createTransporter();

  const qrSection = ticket.qr_code_svg
    ? `<div style="text-align:center;margin:24px 0;padding:20px;background:${MYS_BRAND.cream};border-radius:8px;">
        <p style="color:#666;font-size:13px;margin:0 0 12px;">Your Event QR Code</p>
        <div style="display:inline-block;">${ticket.qr_code_svg}</div>
        <p style="color:#999;font-size:11px;margin:12px 0 0;">Show this at the event entrance</p>
      </div>`
    : '';

  const content = `
    <h2 style="color:${MYS_BRAND.primary};font-size:24px;font-weight:800;margin:0 0 8px;">🎉 Ticket Confirmed!</h2>
    <p style="color:#666;font-size:15px;margin:0 0 24px;">Assalamu Alaikum <strong>${ticket.participant_name}</strong>,<br/>
    Your registration for <strong>${ticket.event_title}</strong> is confirmed!</p>

    <div style="background:${MYS_BRAND.primary};border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding:8px 0;">
            <p style="color:${MYS_BRAND.gold};font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase;">Ticket Number</p>
            <p style="color:#fff;font-size:18px;font-weight:800;margin:0;font-family:monospace;">${ticket.unique_number}</p>
          </td>
          <td style="width:50%;padding:8px 0;">
            <p style="color:${MYS_BRAND.gold};font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase;">Ticket Type</p>
            <p style="color:#fff;font-size:16px;font-weight:700;margin:0;">${ticket.ticket_type_name}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <p style="color:${MYS_BRAND.gold};font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase;">Event Date</p>
            <p style="color:#fff;font-size:14px;margin:0;">${new Date(ticket.start_date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </td>
          <td style="padding:8px 0;">
            <p style="color:${MYS_BRAND.gold};font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase;">Venue</p>
            <p style="color:#fff;font-size:14px;margin:0;">${ticket.venue || 'TBA'}</p>
          </td>
        </tr>
      </table>
    </div>

    ${qrSection}

    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="color:#856404;font-size:13px;margin:0;"><strong>📋 Important:</strong> Please present your QR code or ticket number (${ticket.unique_number}) at the event entrance. A physical event tag will be assigned to you upon entry.</p>
    </div>

    <p style="color:#666;font-size:14px;margin:0;">We look forward to having you at the event. May Allah bless the gathering.</p>
    <p style="color:${MYS_BRAND.primary};font-size:14px;font-weight:600;margin:16px 0 0;">Jazakallahu Khayran 🌟</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'MYS Summit <noreply@mys-summit.org>',
    to: ticket.participant_email,
    subject: `🎫 Your MYS Ticket: ${ticket.unique_number} — ${ticket.event_title}`,
    html: emailWrapper(content),
  });
};

/**
 * Send a campaign email to a single recipient
 */
export const sendCampaignEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'MYS Summit <noreply@mys-summit.org>',
    to,
    subject,
    html,
  });
};

/**
 * Send bulk campaign emails with batching
 */
export const sendBulkCampaignEmails = async (recipients, subject, html, onProgress) => {
  const BATCH_SIZE = 50;
  let sent = 0;
  let failed = 0;
  const logs = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (recipient) => {
        try {
          await sendCampaignEmail({
            to: recipient.email,
            subject,
            html: html.replace('{PARTICIPANT_NAME}', recipient.name || 'Dear Friend'),
          });
          sent++;
          logs.push({ email: recipient.email, participantId: recipient.id, status: 'sent' });
        } catch (err) {
          failed++;
          logs.push({ email: recipient.email, participantId: recipient.id, status: 'failed', error: err.message });
        }
      })
    );

    if (onProgress) onProgress({ sent, failed, total: recipients.length });

    // Rate limit delay between batches
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return { sent, failed, logs };
};
