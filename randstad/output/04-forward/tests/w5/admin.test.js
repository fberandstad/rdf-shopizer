// W5 unit tests — Admin & Analytics (no DB required).
// Maps to golden-master TEST-0023..0027 (FS-0011..0014, RULE-0016..0020).
// Run: node --test ../../tests/w5/admin.test.js  (from converted/server)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SERVER = '../../converted/server';
const admin = require(`${SERVER}/admin`);
const { encryptSecret, decryptSecret, maskSecret } = require(`${SERVER}/crypto`);
const { byName } = require(`${SERVER}/agent/tools`);
const { requireRole } = require(`${SERVER}/middleware/rbac`);

test('TEST-W5-01 (→TEST-0025): product validation', () => {
  assert.throws(() => admin.assertProduct({ name: 'X', priceCents: 100 }), /sku/);
  assert.throws(() => admin.assertProduct({ sku: 'X', priceCents: 100 }), /name/);
  assert.throws(() => admin.assertProduct({ sku: 'X', name: 'Y', priceCents: -1 }), /non-negative/);
  const v = admin.assertProduct({ sku: ' AB ', name: ' Item ', priceCents: 1999, stock: 5 });
  assert.deepEqual(v, { sku: 'AB', name: 'Item', priceCents: 1999, stock: 5 });
  // Partial update allows omitting sku/name/price.
  assert.deepEqual(admin.assertProduct({ priceCents: 50 }, { partial: true }), { priceCents: 50 });
});

test('TEST-W5-02 (→TEST-0026): order status transitions (RULE-0012 forward)', () => {
  assert.equal(admin.canTransition('PAID', 'FULFILLED'), true);
  assert.equal(admin.canTransition('PAID', 'CANCELLED'), true);
  assert.equal(admin.canTransition('AWAITING_PAYMENT', 'CANCELLED'), true);
  assert.equal(admin.canTransition('FULFILLED', 'PAID'), false);   // terminal
  assert.equal(admin.canTransition('PAID', 'AWAITING_PAYMENT'), false); // no backward
  assert.equal(admin.canTransition('CANCELLED', 'FULFILLED'), false);
});

test('TEST-W5-03 (→TEST-0027): gateway secret encrypt/decrypt round-trip + mask (RULE-0018)', () => {
  const secret = 'sk_live_ABCD1234EFGH5678';
  const env = encryptSecret(secret);
  assert.ok(env.startsWith('v1:'), 'self-describing envelope');
  assert.ok(!env.includes(secret), 'ciphertext does not contain plaintext');
  assert.equal(decryptSecret(env), secret);
  assert.equal(maskSecret(secret), '••••5678');
  // Tampered tag must fail (authenticated encryption).
  assert.throws(() => decryptSecret(env.slice(0, -4) + 'AAAA'));
});

test('TEST-W5-04 (→TEST-0023/0024): RBAC middleware enforces admin role', () => {
  const mw = requireRole('admin');
  const call = (user) => new Promise((resolve) => {
    const res = { status: (c) => ({ json: () => resolve(c) }) };
    mw({ user }, res, () => resolve('next'));
  });
  return Promise.all([
    call(undefined).then((r) => assert.equal(r, 401)), // unauth → 401 (TEST-0023)
    call({ role: 'customer' }).then((r) => assert.equal(r, 403)), // wrong role → 403 (TEST-0024)
    call({ role: 'admin' }).then((r) => assert.equal(r, 'next')),
  ]);
});

test('TEST-W5-05: admin tools are guarded (ClawBands HITL) and off MCP', () => {
  assert.equal(byName.manageCatalog.sensitivity, 'guarded');
  assert.equal(byName.manageInventory.sensitivity, 'guarded');
  const { MCP_SAFE } = require(`${SERVER}/agent/tools`);
  assert.ok(!MCP_SAFE.includes('manageCatalog'));
  assert.ok(!MCP_SAFE.includes('manageInventory'));
});

test('TEST-W5-06: manageInventory schema requires integer delta', () => {
  const t = byName.manageInventory;
  assert.throws(() => t.parameters.parse({ sku: 'X', delta: 1.5 }));
  assert.doesNotThrow(() => t.parameters.parse({ sku: 'X', delta: -3 }));
});
