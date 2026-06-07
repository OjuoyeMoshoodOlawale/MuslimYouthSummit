import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ticket number
 * Format: MYS{EDITION}-{ZEROED_SEQUENCE}
 * e.g., MYS3-0001, MYS3-0042
 */
export const generateTicketNumber = (edition, sequence) => {
  const padded = String(sequence).padStart(4, '0');
  return `MYS${edition}-${padded}`;
};

/**
 * Generate a physical event tag number
 * Format: TAG-{ZEROED_SEQUENCE}
 * e.g., TAG-001, TAG-042
 */
export const generateTagNumber = (sequence) => {
  const padded = String(sequence).padStart(3, '0');
  return `TAG-${padded}`;
};

/**
 * Generate a Paystack-style reference
 */
export const generatePaystackRef = (prefix = 'MYS') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Format price in Nigerian Naira
 */
export const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Convert Naira to Kobo (Paystack uses kobo)
 */
export const toKobo = (naira) => Math.round(parseFloat(naira) * 100);

/**
 * Convert Kobo to Naira
 */
export const fromKobo = (kobo) => kobo / 100;

/**
 * Get current effective ticket price (early bird or regular)
 */
export const getEffectivePrice = (ticketType) => {
  const now = new Date();
  const earlyBirdCloses = ticketType.early_bird_closes_at
    ? new Date(ticketType.early_bird_closes_at)
    : null;

  if (
    ticketType.early_bird_price &&
    earlyBirdCloses &&
    now < earlyBirdCloses
  ) {
    return {
      price: ticketType.early_bird_price,
      isEarlyBird: true,
      closesAt: earlyBirdCloses,
    };
  }

  return {
    price: ticketType.price,
    isEarlyBird: false,
    closesAt: null,
  };
};

/**
 * Slugify a string
 */
export const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();

/**
 * Parse pagination query params
 */
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Sanitize a string for safe use
 */
export const sanitize = (str) => {
  if (!str) return '';
  return str.toString().trim();
};

/**
 * Check if a date string is valid
 */
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Generate a UUID
 */
export const uuid = () => uuidv4();
