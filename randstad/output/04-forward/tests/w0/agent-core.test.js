// W0 unit tests — agent core policy & registry (no DB required).
// Run: node --test  (from this directory; requires converted/server deps installed)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SERVER = '../../converted/server';
const { tools, byName, MCP_SAFE } = require(`${SERVER}/agent/tools`);
const { isGuarded } = require(`${SERVER}/agent/clawbands`);
const { businessMetric } = require(`${SERVER}/routes/metricsQueries`);

test('TEST-W0-01: every tool has a complete, typed contract', () => {
  for (const t of tools) {
    assert.ok(t.name, 'name');
    assert.ok(t.description, `${t.name} description`);
    assert.ok(['read', 'write', 'guarded'].includes(t.sensitivity), `${t.name} sensitivity`);
    assert.equal(typeof t.handler, 'function', `${t.name} handler`);
    assert.equal(typeof t.parameters.parse, 'function', `${t.name} zod schema`);
  }
});

test('TEST-W0-02: MCP allow-list is read-only and default-deny for guarded tools', () => {
  for (const name of MCP_SAFE) {
    assert.ok(byName[name], `${name} exists`);
    assert.notEqual(byName[name].sensitivity, 'guarded', `${name} not guarded`);
    assert.ok(!isGuarded(name), `${name} not in guarded config`);
  }
});

test('TEST-W0-03: tool parameter validation rejects bad input', () => {
  assert.throws(() => byName.getBusinessMetrics.parameters.parse({ metric: 'free_form_sql' }));
  assert.throws(() => byName.getProduct.parameters.parse({}));
  assert.doesNotThrow(() => byName.searchCatalog.parameters.parse({}));
});

test('TEST-W0-04: business metrics are role-scoped (admin only) — no DB hit', async () => {
  await assert.rejects(
    () => businessMetric('orders_count', 'today', { role: 'customer' }),
    (e) => e.code === 'FORBIDDEN');
});

test('TEST-W0-05: unknown metric rejected before any query (no free-form SQL)', async () => {
  await assert.rejects(
    () => businessMetric('drop_table', 'today', { role: 'admin' }),
    (e) => e.code === 'BAD_METRIC');
});
