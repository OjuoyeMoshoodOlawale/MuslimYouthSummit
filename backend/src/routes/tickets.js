import { validate, rules } from '../middleware/validate.js';
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  initiateTicketPurchase, verifyTicketPayment,
  paystackWebhook, getTicket,
  adminGetTickets, adminTicketStats
} from '../controllers/ticketController.js';

const router = express.Router();

router.post('/initiate', validate(rules.ticketInitiate), initiateTicketPurchase);
router.get('/verify/:reference', verifyTicketPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), paystackWebhook);
router.get('/admin/all', authenticate, authorize('super_admin', 'admin'), adminGetTickets);
router.get('/admin/stats/:eventId', authenticate, authorize('super_admin', 'admin'), adminTicketStats);

// lookup by unique_number for check-in scanner (remap param name)
router.get('/by-number/:num', authenticate, (req, res, next) => {
  req.params.uniqueNumber = req.params.num;
  return getTicket(req, res, next);
});

router.get('/:uniqueNumber', getTicket);

export default router;
