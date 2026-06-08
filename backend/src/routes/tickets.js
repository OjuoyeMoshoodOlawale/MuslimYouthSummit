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
    const amountFinal  = parseFloat(amount_paid) || parseFloat(tt.regular_price) || 0;
    const qrData       = ticketQRData(uniqueNumber);
    const qrSvg        = await generateQRCodeSVG(qrData).catch(() => null);

    const [tRes] = await query(
      `INSERT INTO tickets
         (participant_id, event_id, ticket_type_id, category_id, unique_number,
          qr_code_svg, amount_paid, is_early_bird, status, purchased_at, paystack_reference)
       VALUES (?,?,?,?,?,?,?,0,'paid',NOW(),?)`,
      [participantId, event_id, ticket_type_id, category_id || null,
       uniqueNumber, qrSvg, amountFinal,
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
