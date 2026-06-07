// Mock PSP provider (sandbox). Tokenized only — receives a provider token / hosted-field
// nonce, NEVER a PAN (ADR-0006, RISK-0001). The API key is supplied by Aquaman and used
// here server-side; it never returns to the caller/LLM context.
// Deterministic behavior for tests:
//   - token 'tok_decline'        -> declined
//   - token 'tok_error'          -> provider error
//   - any other 'tok_*'          -> approved
function makeProvider(credential) {
  // credential = { provider, apiKey } from Aquaman; we intentionally do not log it.
  return {
    name: 'mock',
    async charge({ amountCents, currency, token, mode }) {
      if (!credential || credential.apiKey === undefined) {
        throw new Error('psp credential missing');
      }
      if (token === 'tok_error') {
        const e = new Error('provider error'); e.code = 'PSP_ERROR'; throw e;
      }
      if (token === 'tok_decline') {
        return { ok: false, declined: true, reason: 'card_declined' };
      }
      // Approved: return a tokenized transaction reference (no card data).
      const ref = `txn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      return { ok: true, transactionRef: ref, mode: mode || 'authorizeAndCapture', amountCents, currency };
    },
  };
}

module.exports = { makeProvider };
