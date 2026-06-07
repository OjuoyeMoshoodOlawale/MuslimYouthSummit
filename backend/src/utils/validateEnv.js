/**
 * validateEnv.js
 * Called at server startup — exits with helpful message if required env vars are missing.
 */
export const validateEnv = () => {
  const required = [
    ['DB_HOST',                 'Database host (e.g. localhost)'],
    ['DB_NAME',                 'Database name (e.g. mys_platform)'],
    ['DB_USER',                 'Database username'],
    ['JWT_SECRET',              'JWT signing secret (min 32 chars)'],
    ['PAYSTACK_SECRET_KEY',     'Paystack secret key (sk_live_... or sk_test_...)'],
    ['PAYSTACK_PUBLIC_KEY',     'Paystack public key (pk_live_... or pk_test_...)'],
    ['PAYSTACK_WEBHOOK_SECRET', 'Paystack webhook secret from dashboard'],
    ['PAYMENT_CALLBACK_URL',    'URL Paystack redirects to after payment'],
  ];

  const missing = required.filter(([key]) => !process.env[key]);

  if (missing.length) {
    console.error('\n❌ MYS Platform: Missing required environment variables:\n');
    missing.forEach(([key, desc]) => {
      console.error(`   ${key.padEnd(30)} — ${desc}`);
    });
    console.error('\n   Copy backend/.env.example to backend/.env and fill in all values.\n');
    process.exit(1);
  }

  // Warn about weak JWT secret
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET is very short. Use at least 64 random characters in production.');
  }

  console.log('✅ Environment validated.');
};
