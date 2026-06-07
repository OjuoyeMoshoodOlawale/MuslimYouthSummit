/**
 * paystackService.js
 * All Paystack API calls. Keys read from environment — NEVER hardcoded.
 */
import axios from 'axios';
import crypto from 'crypto';

const BASE = 'https://api.paystack.co';

/** Build an authenticated axios instance fresh per call (reads latest env) */
const ps = () => axios.create({
  baseURL: BASE,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

/**
 * Initialize a Paystack transaction
 */
export const initializeTransaction = async ({ email, amount, reference, metadata, callback_url }) => {
  const { data } = await ps().post('/transaction/initialize', {
    email,
    amount,   // in kobo
    reference,
    metadata,
    callback_url: callback_url || process.env.PAYMENT_CALLBACK_URL,
  });
  if (!data.status) throw new Error(data.message || 'Paystack init failed.');
  return data.data;
};

/**
 * Verify a Paystack transaction
 */
export const verifyTransaction = async (reference) => {
  const { data } = await ps().get(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (!data.status) throw new Error(data.message || 'Paystack verification failed.');
  return data.data;
};

/**
 * Verify HMAC-SHA512 webhook signature
 * @param {Buffer|string} rawBody - express.raw() body
 * @param {string} signature     - x-paystack-signature header
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) return false;
  const hash = crypto.createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
};
