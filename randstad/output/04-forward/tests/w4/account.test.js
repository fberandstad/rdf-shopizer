// W4 unit tests — Orders & Account (no DB required).
// Maps to golden-master TEST-0015..0022 (FS-0005/0006/0007/0009, RULE-0013/0014/0015/0020).
// Run: node --test ../../tests/w4/account.test.js  (from converted/server)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SERVER = '../../converted/server';
const account = require(`${SERVER}/account`);
const content = require(`${SERVER}/content`);
const { byName, MCP_SAFE } = require(`${SERVER}/agent/tools`);

test('TEST-W4-01 (→TEST-0018): registration validation + email normalization', () => {
  assert.throws(() => account.assertRegistration({ email: 'bad', password: 'longenough', name: 'A' }), /email/);
  assert.throws(() => account.assertRegistration({ email: 'a@b.io', password: 'short', name: 'A' }), /8 characters/);
  assert.throws(() => account.assertRegistration({ email: 'a@b.io', password: 'longenough', name: '' }), /name/);
  const v = account.assertRegistration({ email: 'Ada@Example.IO', password: 'longenough', name: ' Ada ' });
  assert.deepEqual(v, { email: 'ada@example.io', password: 'longenough', name: 'Ada' });
});

test('TEST-W4-02 (→TEST-0019): profile + address validation', () => {
  assert.throws(() => account.assertProfile({ name: '' }), /name/);
  assert.throws(() => account.assertProfile({ name: 'Ada', phone: 'abc' }), /phone/);
  assert.deepEqual(account.assertProfile({ name: 'Ada', phone: '+33 6 12 34 56' }),
    { name: 'Ada', phone: '+33 6 12 34 56' });

  assert.throws(() => account.assertAddress({ city: 'Paris', postalCode: '75001' }), /line1/);
  assert.throws(() => account.assertAddress({ line1: 'x', city: 'Paris', postalCode: '75001', country: 'FRA' }), /2-letter/);
  const a = account.assertAddress({ line1: '1 Rue', city: 'Paris', postalCode: '75001', country: 'fr' });
  assert.equal(a.country, 'FR');
});

test('TEST-W4-03 (→TEST-0020): review rating must be 1-5', () => {
  assert.throws(() => content.assertReview({ rating: 0 }), /1-5/);
  assert.throws(() => content.assertReview({ rating: 6 }), /1-5/);
  assert.throws(() => content.assertReview({ rating: 3.5 }), /1-5/);
  assert.deepEqual(content.assertReview({ rating: 4, title: 'Good', body: 'ok' }),
    { rating: 4, title: 'Good', body: 'ok' });
});

test('TEST-W4-04 (→TEST-0017): supported cards per store (RULE-0020)', () => {
  assert.deepEqual(content.supportedCards(), ['VISA', 'MASTERCARD', 'AMEX']);
});

test('TEST-W4-05 (→TEST-0021): download authorization (RULE-0015)', () => {
  assert.equal(content.canDownload({ isAdmin: true }), true);
  assert.equal(content.canDownload({ role: 'admin' }), true);
  assert.equal(content.canDownload({ hasPaidOrderWithProduct: true }), true);
  assert.equal(content.canDownload({ hasPaidOrderWithProduct: false }), false);
  assert.equal(content.canDownload({}), false);
});

test('TEST-W4-06: account/content tool sensitivities + MCP policy', () => {
  assert.equal(byName.submitReview.sensitivity, 'write');
  assert.equal(byName.subscribeNewsletter.sensitivity, 'write');
  assert.equal(byName.listProductReviews.sensitivity, 'read');
  assert.ok(MCP_SAFE.includes('listProductReviews'), 'public reviews readable over MCP');
  assert.ok(!MCP_SAFE.includes('submitReview'), 'review writes not on MCP');
  assert.ok(!MCP_SAFE.includes('subscribeNewsletter'), 'PII write not on MCP');
});

test('TEST-W4-07: review tool schema enforces rating bounds', () => {
  const t = byName.submitReview;
  assert.throws(() => t.parameters.parse({ sku: 'X', rating: 0 }));
  assert.throws(() => t.parameters.parse({ sku: 'X', rating: 9 }));
  assert.doesNotThrow(() => t.parameters.parse({ sku: 'X', rating: 5, title: 'Great' }));
});
