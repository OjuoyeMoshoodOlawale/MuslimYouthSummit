import axios from 'axios';
import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';
const SECRET = () => process.env.PAYSTACK_SECRET_KEY;

const paystackAxios = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize a Paystack transaction
 * @param {Object} opts
 * @returns {Promise<{authorization_url, access_code, reference}>}
 */
export const initializeTransaction = async ({ email, amount, reference, metadata, callback_url }) => {
  const { data } = await paystackAxios.post('/transaction/initialize', {
    email,
    amount, // in kobo
    reference,
    metadata,
    callback_url: callback_url || process.env.PAYMENT_CALLBACK_URL,
  });

  if (!data.status) {
    throw new Error(data.message || 'Paystack transaction initialization failed.');
  }

  return data.data;
};

/**
 * Verify a Paystack transaction
 * @param {string} reference
 * @returns {Promise<Object>} transaction data
 */
export const verifyTransaction = async (reference) => {
  const { data } = await paystackAxios.get(`/transaction/verify/${reference}`);

  if (!data.status) {
    throw new Error(data.message || 'Paystack transaction verification failed.');
  }

  return data.data;
};

/**
 * Verify Paystack webhook signature
 * @param {string} body - raw request body string
 * @param {string} signature - x-paystack-signature header
 * @returns {boolean}
 */
export const verifyWebhookSignature = (body, signature) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || SECRET())
    .update(body)
    .digest('hex');
  return hash === signature;
};
