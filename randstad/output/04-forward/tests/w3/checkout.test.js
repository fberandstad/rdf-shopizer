// W3 unit tests — Checkout & Payment (no DB required).
// Maps to golden-master TEST-0009..0014 (FS-0003/0004, RULE-0008..0012, RISK-0001).
// Run: node --test ../../tests/w3/checkout.test.js  (from converted/server)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SERVER = '../../converted/server';
const payments = require(`${SERVER}/payments`);
const orders = require(`${SERVER}/orders`);
const { byName, MCP_SAFE } = require(`${SERVER}/agent/tools`);
const { isGuarded } = require(`${SERVER}/agent/clawbands`);

test('TEST-W3-01 (→TEST-0009): customer context required (RULE-0008)', () => {
  assert.throws(() => orders.assertCustomer({}), /name/);
  assert.throws(() => orders.assertCustomer({ name: 'A', email: 'bad' }), /email/);
  assert.deepEqual(orders.assertCustomer({ name: 'Ada', email: 'ada@x.io' }), { name: 'Ada', email: 'ada@x.io' });
});

test('TEST-W3-02 (RISK-0001/DEBT-0016): raw PAN is rejected, tokens accepted', () => {
  assert.equal(payments.looksLikePan('4242424242424242'), true);  // Luhn-valid card
  assert.equal(payments.looksLikePan('tok_test_visa'), false);
  assert.throws(() => payments.assertToken('4242 4242 4242 4242'), /token/i);
  assert.doesNotThrow(() => payments.assertToken('tok_test_visa'));
});

test('TEST-W3-03 (→TEST-0011/0012): tokenized charge approves via PSP (Aquaman key, no PAN)', async () => {
  const res = await payments.charge({ amountCents: 1999, currency: 'EUR', token: 'tok_test_visa' });
  assert.equal(res.ok, true);
  assert.match(res.transactionRef, /^txn_/);
});

test('TEST-W3-04 (→TEST-0014): declined payment returns not-ok (drives rollback)', async () => {
  const res = await payments.charge({ amountCents: 1999, currency: 'EUR', token: 'tok_decline' });
  assert.equal(res.ok, false);
  assert.equal(res.declined, true);
});

test('TEST-W3-05: PAN never reaches the PSP (charge rejects before provider)', async () => {
  await assert.rejects(
    () => payments.charge({ amountCents: 100, currency: 'EUR', token: '4242424242424242' }),
    (e) => e.code === 'PAN_REJECTED');
});

test('TEST-W3-06: payment/transaction id is masked (RULE-0014)', () => {
  assert.equal(orders.maskPaymentRef('txn_abcdef1234'), '••••1234');
  assert.equal(orders.maskPaymentRef(null), null);
});

test('TEST-W3-07: payOrder is guarded (ClawBands HITL) and off MCP; createOrder is write', () => {
  assert.equal(byName.payOrder.sensitivity, 'guarded');
  assert.ok(isGuarded('payOrder'), 'payOrder in guarded list');
  assert.ok(!MCP_SAFE.includes('payOrder'), 'payOrder not exposed over MCP');
  assert.ok(!MCP_SAFE.includes('createOrder'), 'createOrder not exposed over MCP');
  assert.equal(byName.createOrder.sensitivity, 'write');
  assert.ok(MCP_SAFE.includes('calculateShipping'), 'calculateShipping (read) on MCP');
});

test('TEST-W3-08: payOrder schema rejects missing token / bad orderId', () => {
  const t = byName.payOrder;
  assert.throws(() => t.parameters.parse({ orderId: 1 }));               // no token
  assert.throws(() => t.parameters.parse({ orderId: 0, paymentToken: 'tok_x' }));
  assert.doesNotThrow(() => t.parameters.parse({ orderId: 1, paymentToken: 'tok_x' }));
});
