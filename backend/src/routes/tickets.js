import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, rules } from '../middleware/validate.js';
import { query } from '../database/db.js';
import { success as ok, error as err, notFound as notFoundRes } from '../utils/response.js';
import {
  initiateTicketPurchase, verifyTicketPayment,
  paystackWebhook, getTicket,
  adminGetTickets, adminTicketStats,
} from '../controllers/ticketController.js';
import { generateTicketNumber } from '../utils/helpers.js';
import { generateQRCodeSVG, ticketQRData } from '../services/qrcodeService.js';
import { sendTicketEmail } from '../services/emailService.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────
router.post('/initiate', validate(rules.ticketInitiate), initiateTicketPurchase);
router.get('/verify/:reference', verifyTicketPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), paystackWebhook);

// ── Admin ─────────────────────────────────────────────────────
router.get('/admin/all',         authenticate, authorize('super_admin','admin'), adminGetTickets);
router.get('/admin/stats/:eventId', authenticate, authorize('super_admin','admin'), adminTicketStats);

// Lookup by unique_number for check-in scanner
router.get('/by-number/:num', authenticate, (req, res, next) => {
  req.params.uniqueNumber = req.params.num;
  return getTicket(req, res, next);
});
router.get('/:uniqueNumber', getTicket);

// ── Manual registration (admin / department staff) ─────────────
router.post('/manual', authenticate, authorize('super_admin','admin','department'), async (req, res, next) => {
  try {
    const {
      event_id, ticket_type_id, category_id,
      name, email, phone, gender, occupation,
      amount_paid, payment_method = 'cash', payment_note = '',
      send_email = true,
    } = req.body;

    if (!event_id || !ticket_type_id || !name || !email || !phone)
      return err(res, 'event_id, ticket_type_id, name, email and phone are required.', 400);

    // Validate event
    const [events] = await query('SELECT * FROM events WHERE id=?', [event_id]);
    if (!events.length) return notFoundRes(res, 'Event');

    // Validate ticket type
    const [tts] = await query(
      'SELECT * FROM ticket_types WHERE id=? AND event_id=? AND is_active=1',
      [ticket_type_id, event_id]
    );
    if (!tts.length) return err(res, 'Ticket type not found or inactive.', 400);
    const tt = tts[0];

    // Find or create participant
    let participantId;
    const [existing] = await query('SELECT id FROM participants WHERE email=?', [email.toLowerCase()]);
    if (existing.length) {
      participantId = existing[0].id;
      await query('UPDATE participants SET name=?, phone=?, updated_at=NOW() WHERE id=?',
        [name, phone, participantId]);
    } else {
      const [ins] = await query(
        'INSERT INTO participants (name, email, phone, gender, occupation) VALUES (?,?,?,?,?)',
        [name, email.toLowerCase(), phone, gender || null, occupation || null]
      );
      participantId = ins.insertId;
    }

    // Duplicate check
    const [[{ dup }]] = await query(
      "SELECT COUNT(*) AS dup FROM tickets WHERE participant_id=? AND event_id=? AND status='paid'",
      [participantId, event_id]
    );
    if (dup > 0) return err(res, 'This participant already has a paid ticket for this event.', 409);

    // Generate unique ticket number
    const [[{ cnt }]] = await query('SELECT COUNT(*) AS cnt FROM tickets WHERE event_id=?', [event_id]);
    const uniqueNumber = generateTicketNumber(events[0].edition || 'MYS', cnt + 1);
    const amountFinal  = parseFloat(amount_paid) || 0;
    const ticketPrice  = parseFloat(tt.regular_price) || 0;
    const balanceDue   = Math.max(0, ticketPrice - amountFinal);

    const [tRes] = await query(
      `INSERT INTO tickets
         (participant_id, event_id, ticket_type_id, category_id, unique_number,
          qr_code_svg, amount_paid, balance_due, payment_method, payment_note,
          is_early_bird, status, purchased_at, paystack_reference)
       VALUES (?,?,?,?,?,?,?,?,?,?,0,'paid',NOW(),?)`,
      [participantId, event_id, ticket_type_id, category_id || null,
       uniqueNumber, qrSvg, amountFinal, balanceDue,
       payment_method || 'cash', payment_note || null,
       `MANUAL-${Date.now()}-${participantId}`]
    );

    await query('UPDATE ticket_types SET quantity_sold=quantity_sold+1 WHERE id=?', [ticket_type_id]);

    const ticket = {
      id: tRes.insertId, unique_number: uniqueNumber,
      participant_name: name, participant_email: email,
      event_title: events[0].title, qr_code_svg: qrSvg,
      amount_paid: amountFinal, payment_method, payment_note,
      ticket_type_name: tt.name, edition: events[0].edition,
      event_venue: events[0].venue, event_start_date: events[0].start_date,
    };

    if (send_email) sendTicketEmail(ticket).catch(console.error);

    ok(res, ticket, `Ticket ${uniqueNumber} created for ${name}.`);
  } catch (e) { next(e); }
});

export default router;

/* ── Certificate (printable HTML) ───────────────────────────── */
router.get('/certificate/:uniqueNumber', async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT t.unique_number, t.purchased_at,
              p.name AS participant_name,
              e.title AS event_title, e.edition,
              e.start_date, e.end_date, e.venue,
              tt.name AS ticket_type
       FROM tickets t
       JOIN participants p  ON p.id  = t.participant_id
       JOIN events e        ON e.id  = t.event_id
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       WHERE t.unique_number = ? AND t.status = 'paid'`,
      [req.params.uniqueNumber]
    );
    if (!rows.length) return res.status(404).send('<h1>Certificate not found</h1>');
    const r = rows[0];
    const date = new Date(r.end_date || r.start_date).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'});

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Certificate — ${r.participant_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #fff; }
    .cert {
      width: 900px; min-height: 636px; margin: 40px auto;
      border: 8px solid #02462E; padding: 48px 64px;
      background: #FBF6E6;
      position: relative; text-align: center;
    }
    .cert::before {
      content: ''; position: absolute; inset: 12px;
      border: 2px solid #FEC700; pointer-events: none;
    }
    .badge { color: #FEC700; font-size: 12px; font-weight: bold; letter-spacing: 0.3em; text-transform: uppercase; }
    h1 { font-family: 'Syne', sans-serif; font-size: 40px; color: #02462E; margin: 16px 0 8px; }
    .sub { color: #555; font-size: 15px; margin: 0 0 32px; }
    .name { font-family: 'Syne', sans-serif; font-size: 52px; color: #02462E; font-weight: 800;
            border-bottom: 3px solid #FEC700; display: inline-block; padding-bottom: 6px; margin: 16px 0 8px; }
    .desc { color: #444; font-size: 16px; line-height: 1.8; margin: 16px 0 32px; }
    .meta { display: flex; justify-content: center; gap: 48px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #ccc; }
    .meta div { text-align: center; }
    .meta .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.15em; }
    .meta .value { font-weight: bold; color: #02462E; font-size: 14px; margin-top: 4px; }
    .ticket-no { font-size: 12px; color: #aaa; margin-top: 20px; }
    @media print {
      body { margin: 0; }
      .cert { margin: 0; border-radius: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="badge">Muslim Youth Summit — Certificate of Attendance</div>
    <h1>${r.event_title}</h1>
    <p class="sub">${r.edition}</p>
    <p style="color:#555;font-size:15px">This is to certify that</p>
    <div class="name">${r.participant_name}</div>
    <p class="desc">
      attended the <strong>${r.event_title}</strong> held on <strong>${date}</strong>
      ${r.venue ? `at <strong>${r.venue}</strong>` : ''}.
    </p>
    <div class="meta">
      <div><div class="label">Ticket Type</div><div class="value">${r.ticket_type}</div></div>
      <div><div class="label">Ticket Number</div><div class="value">${r.unique_number}</div></div>
      <div><div class="label">Date Issued</div><div class="value">${date}</div></div>
    </div>
    <p class="ticket-no">Issued by Muslim Youth Summit Admin • muslimyouthsummit.com</p>
  </div>
  <div class="no-print" style="text-align:center;margin:20px;font-family:sans-serif">
    <button onclick="window.print()" style="background:#02462E;color:white;border:none;padding:12px 32px;font-size:16px;cursor:pointer;font-weight:bold;">
      🖨️ Print Certificate
    </button>
  </div>
</body>
</html>`);
  } catch (e) { next(e); }
});
