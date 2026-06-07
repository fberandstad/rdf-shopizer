// SOAP→REST interop facade (FS-0015, SPEC-0041, ADR-0009). Replaces the legacy JAX-WS
// `salesManagerCustomerService` / `salesManagerInvoiceService` with documented, versioned,
// read-only REST resources for external B2B systems. Bearer-token auth (per-client), NOT
// session-gated. PII-minimized; payment references masked (RULE-0014). No write operations.
const express = require('express');
const { pool } = require('./../db');
const { maskPaymentRef } = require('./../orders');
const config = require('./../config');

const router = express.Router();

// Per-client bearer auth (mirrors MCP; falls back to MCP tokens). Audit-friendly clientId.
function authenticate(req) {
  const hdr = req.headers['authorization'] || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return null;
  const entry = Object.entries(config.interop.clientTokens).find(([, t]) => t === token);
  return entry ? entry[0] : null;
}
router.use((req, res, next) => {
  // The OpenAPI descriptor and service index are public (analog of a published WSDL).
  if (req.path === '/openapi.json' || req.path === '/' || req.path === '') return next();
  const clientId = authenticate(req);
  if (!clientId) return res.status(401).json({ error: 'invalid interop client token' });
  req.interopClient = clientId;
  next();
});

// Service index — modern equivalent of the WSDL service listing (TEST-0028).
const SERVICE_DESCRIPTOR = {
  service: 'shopiclaw-interop',
  version: 'v1',
  replaces: ['salesManagerCustomerService', 'salesManagerInvoiceService'],
  protocol: 'REST/JSON (OpenAPI 3.0)',
  authentication: 'Bearer token (per-client)',
  operations: [
    { name: 'getCustomer', method: 'GET', path: '/api/interop/v1/customers/{id}' },
    { name: 'getInvoice', method: 'GET', path: '/api/interop/v1/invoices/{orderId}' },
  ],
};

router.get('/', (req, res) => res.json(SERVICE_DESCRIPTOR));

// OpenAPI descriptor — the documented replacement for the legacy WSDL (ADR-0009).
router.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: { title: 'ShopiClaw Interop API', version: '1.0.0',
      description: 'REST replacement for legacy SOAP salesManagerCustomerService / salesManagerInvoiceService (FS-0015).' },
    servers: [{ url: '/api/interop/v1' }],
    components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } } },
    security: [{ bearer: [] }],
    paths: {
      '/customers/{id}': { get: { operationId: 'getCustomer', summary: 'Customer service (PII-minimized)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Customer' }, 404: { description: 'Not found' } } } },
      '/invoices/{orderId}': { get: { operationId: 'getInvoice', summary: 'Invoice service (masked payment)',
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Invoice' }, 404: { description: 'Not found' } } } },
    },
  });
});

// Customer service (FS-0015) — minimized fields only (no password hash, no internal flags).
router.get('/v1/customers/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rows } = await pool.query(
    `SELECT id, name, email, role, created_at FROM app_user WHERE id=$1`, [id]);
  if (!rows[0]) return res.status(404).json({ error: 'customer not found' });
  res.json({ id: rows[0].id, name: rows[0].name, email: rows[0].email, since: rows[0].created_at });
});

// Invoice service (FS-0015) — totals + line items + MASKED payment ref (RULE-0014). Read-only.
router.get('/v1/invoices/:orderId', async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  const { rows } = await pool.query('SELECT * FROM orders WHERE id=$1', [orderId]);
  const o = rows[0];
  if (!o) return res.status(404).json({ error: 'invoice not found' });
  const items = (await pool.query(
    'SELECT sku, name, unit_price_cents, quantity FROM order_item WHERE order_id=$1 ORDER BY id', [orderId])).rows;
  res.json({
    invoiceId: o.id, status: o.status, currency: o.currency,
    subtotal: o.subtotal_cents, tax: o.tax_cents, shipping: o.shipping_cents, total: o.total_cents,
    payment: o.payment_ref ? { provider: o.payment_provider, ref: maskPaymentRef(o.payment_ref), paidAt: o.paid_at } : null,
    items, issuedAt: o.created_at,
  });
});

module.exports = router;
