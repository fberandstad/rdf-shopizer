// Aquaman — credential isolation broker (ADR-0007, RISK-0002/0016).
// Secrets (PSP keys, etc.) are fetched here and used INSIDE tool handlers only.
// They are NEVER returned to the agent/LLM context or logged.
const config = require('./../config');

const VAULT = {
  psp: { provider: config.psp.provider, apiKey: config.psp.apiKey },
  // add carrier/email creds here; sourced from secret manager in production
};

function useCredential(name, fn) {
  const cred = VAULT[name];
  if (!cred) throw new Error(`credential '${name}' not configured`);
  // fn receives the secret in a closed scope; result must not include the secret.
  return fn(cred);
}

// Redact any accidental secret-looking values before they reach logs/LLM.
function redact(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\b(sk|pk|rk)_[A-Za-z0-9]{8,}\b/g, '[REDACTED_KEY]')
    .replace(/\b\d{13,19}\b/g, '[REDACTED_PAN]'); // never let card-like numbers through
}

module.exports = { useCredential, redact };
