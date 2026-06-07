// Payment provider registry (RULE-0009..0011). Providers are tokenized adapters; the
// secret key is fetched via Aquaman and stays in server scope (never in LLM/logs).
const { useCredential } = require('./../agent/aquaman');
const config = require('./../config');
const mock = require('./mock');

const PROVIDERS = {
  mock: mock.makeProvider,
  // stripe/paypal/etc. adapters plug in here (tokenized) in later iterations.
};

// Reject anything that looks like a real card number (Luhn-valid, 13-19 digits).
// ShopiClaw must NEVER receive a PAN — only provider tokens (RISK-0001, DEBT-0016).
function looksLikePan(value) {
  const digits = String(value || '').replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
}

function assertToken(token) {
  if (!token || typeof token !== 'string') {
    const e = new Error('payment token required'); e.code = 'VALIDATION'; throw e;
  }
  if (looksLikePan(token)) {
    const e = new Error('raw card numbers are not accepted; use a payment token');
    e.code = 'PAN_REJECTED'; throw e;
  }
}

// Run a tokenized charge through the configured provider, using Aquaman for the key.
async function charge({ amountCents, currency, token, mode }) {
  assertToken(token);
  const factory = PROVIDERS[config.psp.provider] || PROVIDERS.mock;
  return useCredential('psp', (cred) => factory(cred).charge({ amountCents, currency, token, mode }));
}

module.exports = { charge, assertToken, looksLikePan };
