// W1 unit tests — Catalog & RAG (no DB required).
// Maps to golden-master TEST-0001..0004 (catalog landing/browse/detail/search).
// Run: node --test ../../tests/w1/catalog.test.js  (from converted/server)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SERVER = '../../converted/server';
const { byName, MCP_SAFE } = require(`${SERVER}/agent/tools`);
const { productToText } = require(`${SERVER}/rag/ingest`);

test('TEST-W1-01 (→TEST-0001/0002): listCategories is a read tool exposed for browsing', () => {
  const t = byName.listCategories;
  assert.ok(t, 'listCategories registered');
  assert.equal(t.sensitivity, 'read');
  assert.ok(MCP_SAFE.includes('listCategories'), 'exposed over MCP (read-only)');
  assert.doesNotThrow(() => t.parameters.parse({}));
});

test('TEST-W1-02 (→TEST-0003): getProduct requires a SKU and is read-only', () => {
  const t = byName.getProduct;
  assert.equal(t.sensitivity, 'read');
  assert.throws(() => t.parameters.parse({}));            // missing sku
  assert.doesNotThrow(() => t.parameters.parse({ sku: 'EL-001' }));
});

test('TEST-W1-03 (→TEST-0004): searchCatalog accepts optional query + category', () => {
  const t = byName.searchCatalog;
  assert.equal(t.sensitivity, 'read');
  assert.doesNotThrow(() => t.parameters.parse({}));
  assert.doesNotThrow(() => t.parameters.parse({ q: 'headphones', categoryCode: 'electronics' }));
});

test('TEST-W1-04: ragSearch is restricted to safe collections (catalog|policy)', () => {
  const t = byName.ragSearch;
  assert.doesNotThrow(() => t.parameters.parse({ query: 'return policy', collection: 'policy' }));
  assert.throws(() => t.parameters.parse({ query: 'x', collection: 'twin_knowledge' })); // not via ragSearch
});

test('TEST-W1-05: productToText builds grounded, searchable text (drives RAG relevance)', () => {
  const text = productToText({
    sku: 'EL-001', name: 'Wireless Headphones', price_cents: 7999, currency: 'EUR',
    category_name: 'Electronics', description: 'Over-ear, noise cancelling',
    attributes: { color: 'black', wireless: true },
  });
  assert.match(text, /Wireless Headphones/);
  assert.match(text, /SKU: EL-001/);
  assert.match(text, /Category: Electronics/);
  assert.match(text, /79\.99 EUR/);
  assert.match(text, /color: black/);
});
