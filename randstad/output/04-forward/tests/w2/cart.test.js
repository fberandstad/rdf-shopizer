// W2 unit tests — Cart pricing & rules (no DB required).
// Maps to golden-master TEST-0005..0008 (FS-0002, RULE-0001..0007).
// Run: node --test ../../tests/w2/cart.test.js  (from converted/server)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SERVER = '../../converted/server';
const { computeTotals, optionsKey } = require(`${SERVER}/cart`);
const { byName, MCP_SAFE } = require(`${SERVER}/agent/tools`);

test('TEST-W2-01 (→TEST-0005/0007): server-side totals (RULE-0007)', () => {
  const items = [
    { unit_price_cents: 7999, quantity: 2 },
    { unit_price_cents: 1499, quantity: 1 },
  ];
  const t = computeTotals(items, { taxRateBps: 2000, shippingCents: 500, currency: 'EUR' });
  assert.equal(t.subtotal_cents, 7999 * 2 + 1499);   // 17497
  assert.equal(t.tax_cents, Math.round(17497 * 2000 / 10000)); // 20% = 3499
  assert.equal(t.shipping_cents, 500);
  assert.equal(t.total_cents, 17497 + 3499 + 500);
});

test('TEST-W2-02: empty cart has zero totals and no shipping', () => {
  const t = computeTotals([], { taxRateBps: 2000, shippingCents: 500 });
  assert.deepEqual([t.subtotal_cents, t.tax_cents, t.shipping_cents, t.total_cents], [0, 0, 0, 0]);
});

test('TEST-W2-03 (→TEST-0007): option-set key is order-independent (RULE-0005 merge)', () => {
  assert.equal(optionsKey({ color: 'red', size: 'M' }), optionsKey({ size: 'M', color: 'red' }));
  assert.notEqual(optionsKey({ color: 'red' }), optionsKey({ color: 'blue' }));
  assert.equal(optionsKey(undefined), optionsKey({}));
});

test('TEST-W2-04 (→TEST-0006): addToCart schema rejects non-positive quantity (RULE-0003)', () => {
  const t = byName.addToCart;
  assert.equal(t.sensitivity, 'write');
  assert.throws(() => t.parameters.parse({ sku: 'EL-001', quantity: 0 }));
  assert.throws(() => t.parameters.parse({ sku: 'EL-001', quantity: -2 }));
  assert.throws(() => t.parameters.parse({ sku: 'EL-001', quantity: 1.5 }));
  assert.doesNotThrow(() => t.parameters.parse({ sku: 'EL-001', quantity: 3 }));
});

test('TEST-W2-05 (→TEST-0008): updateCart allows qty 0 (remove), rejects negative', () => {
  const t = byName.updateCart;
  assert.doesNotThrow(() => t.parameters.parse({ itemId: 1, quantity: 0 }));
  assert.throws(() => t.parameters.parse({ itemId: 1, quantity: -1 }));
});

test('TEST-W2-06: write cart tools are NOT exposed over MCP (default-deny)', () => {
  for (const name of ['getCart', 'addToCart', 'updateCart']) assert.ok(byName[name], `${name} exists`);
  assert.ok(!MCP_SAFE.includes('addToCart'), 'addToCart not on MCP');
  assert.ok(!MCP_SAFE.includes('updateCart'), 'updateCart not on MCP');
});
