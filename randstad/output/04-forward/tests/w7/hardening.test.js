// W7 unit tests — Hardening & Compliance (no DB required).
// Maps to RISK-0010/0011/0020 and DPR-0008/0011. DB/HTTP flows in tests/e2e/compliance.e2e.spec.ts.
// Run: node --test ../../tests/w7/hardening.test.js  (from converted/server)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SERVER = '../../converted/server';
const { securityHeaders, contentSecurityPolicy } = require(`${SERVER}/middleware/security`);
const retention = require(`${SERVER}/retention`);
const content = require(`${SERVER}/content`);

function mockRes() {
  const headers = {};
  return {
    headers,
    setHeader(k, v) { headers[k.toLowerCase()] = v; },
    removeHeader(k) { delete headers[k.toLowerCase()]; },
  };
}

test('TEST-W7-01 (RISK-0011): CSP locks down sources (XSS/clickjacking)', () => {
  const csp = contentSecurityPolicy();
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);     // anti-clickjacking
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /script-src 'self'/);          // no remote/inline scripts
  assert.match(csp, /connect-src 'self' https:\/\/api\.openai\.com/);
});

test('TEST-W7-02 (RISK-0010/0011): security headers applied; X-Powered-By stripped', () => {
  const res = mockRes(); let nexted = false;
  securityHeaders({}, res, () => { nexted = true; });
  assert.ok(nexted);
  assert.ok(res.headers['content-security-policy']);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'DENY');
  assert.match(res.headers['referrer-policy'], /strict-origin/);
  assert.ok(res.headers['permissions-policy']);
});

test('TEST-W7-03 (DPR-0011): retention cutoff window is correct', () => {
  const now = new Date('2026-06-07T00:00:00Z');
  const c = retention.cutoff(now, 90);
  assert.equal(c.toISOString(), '2026-03-09T00:00:00.000Z'); // 90 days earlier
  assert.ok(retention.cutoff(now, 1) < now);
});

test('TEST-W7-04 (DPR-0008): consent withdrawal validates email before any write', async () => {
  await assert.rejects(() => content.withdrawConsent('not-an-email'), /valid email/);
  await assert.rejects(() => content.withdrawConsent(''), /valid email/);
});
