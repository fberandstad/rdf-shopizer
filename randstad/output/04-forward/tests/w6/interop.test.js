// W6 unit tests — Interop & Heartbeat (no DB required).
// Maps to golden-master TEST-0028 (FS-0015) + MCP/heartbeat behavior.
// Run: node --test ../../tests/w6/interop.test.js  (from converted/server)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SERVER = '../../converted/server';
const notifications = require(`${SERVER}/notifications`);
const heartbeat = require(`${SERVER}/agent/heartbeat`);
const { MCP_SAFE } = require(`${SERVER}/agent/tools`);

test('TEST-W6-01: notification formatters (PII-minimized, no card data)', () => {
  const conf = notifications.formatOrderConfirmation({ id: 7, customer_email: 'a@b.io', total_cents: 1999, currency: 'EUR' });
  assert.equal(conf.type, 'order_confirmation');
  assert.equal(conf.recipient, 'a@b.io');
  assert.match(conf.subject, /#7/);
  assert.match(conf.body, /€19.99/);

  const low = notifications.formatLowStock([{ sku: 'A' }, { sku: 'B' }], 5);
  assert.equal(low.type, 'low_stock');
  assert.deepEqual(low.meta.skus, ['A', 'B']);

  const brief = notifications.formatBriefing({ orders: 3, revenue: 5000, lowStock: 1, newCustomers: 2, escalate: true });
  assert.equal(brief.type, 'briefing');
  assert.match(brief.body, /escalation recommended/);
});

test('TEST-W6-02: heartbeat abandoned-cart detection (pure)', () => {
  const now = new Date('2026-01-02T00:00:00Z');
  const old = '2026-01-01T00:00:00Z'; // 24h earlier
  assert.equal(heartbeat.isAbandoned(old, now, 24), true);
  assert.equal(heartbeat.isAbandoned(old, now, 48), false);
});

test('TEST-W6-03: heartbeat escalation is deterministic (cost control)', () => {
  assert.equal(heartbeat.shouldEscalate({ lowStock: 0, abandoned: 0, orders: 5 }), false);
  assert.equal(heartbeat.shouldEscalate({ lowStock: 2, abandoned: 0, orders: 5 }), true); // low stock
  assert.equal(heartbeat.shouldEscalate({ lowStock: 0, abandoned: 3, orders: 5 }), true); // many abandoned
  assert.equal(heartbeat.shouldEscalate({ lowStock: 0, abandoned: 0, orders: 0 }), true); // no orders
});

test('TEST-W6-04: MCP exposes only read/safe tools (default-deny money path)', () => {
  for (const guarded of ['payOrder', 'requestRefund', 'manageCatalog', 'manageInventory']) {
    assert.ok(!MCP_SAFE.includes(guarded), `${guarded} must not be MCP-exposed`);
  }
  assert.ok(MCP_SAFE.includes('searchCatalog'));
  assert.ok(MCP_SAFE.includes('twinKnowledgeSearch'));
});

test('TEST-W6-05: send() validates required fields', async () => {
  await assert.rejects(() => notifications.send({ type: 'x', subject: '' }), /requires/);
});
