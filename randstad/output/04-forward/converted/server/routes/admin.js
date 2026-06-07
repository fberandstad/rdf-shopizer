// Admin routes (FS-0011/0012/0013/0014, RULE-0016/0017/0018). Every route is admin-only
// (RBAC). Catalog/inventory/order management + merchant gateway config (secrets encrypted,
// masked on read). Analytics live under /api/ops/metrics/business.
const express = require('express');
const admin = require('./../admin');
const notifications = require('./../notifications');
const heartbeat = require('./../agent/heartbeat');
const retention = require('./../retention');
const { requireRole } = require('./../middleware/rbac');

const router = express.Router();
router.use(requireRole('admin')); // RULE-0016/0017: admin endpoints require admin role

function mapError(res, e) {
  const status = e.code === 'VALIDATION' ? 422 : e.code === 'CONFLICT' ? 409
    : e.code === 'NOT_FOUND' ? 404 : e.code === 'INVALID_TRANSITION' ? 409 : 500;
  res.status(status).json({ error: e.message });
}

// --- Catalog ---
router.post('/products', async (req, res) => {
  try { res.status(201).json(await admin.createProduct(req.body || {})); } catch (e) { mapError(res, e); }
});
router.put('/products/:sku', async (req, res) => {
  try { res.json(await admin.updateProduct(req.params.sku, req.body || {})); } catch (e) { mapError(res, e); }
});
router.patch('/products/:sku/stock', async (req, res) => {
  try { res.json(await admin.adjustStock(req.params.sku, (req.body || {}).delta)); } catch (e) { mapError(res, e); }
});
router.post('/categories', async (req, res) => {
  try { res.status(201).json(await admin.createCategory(req.body || {})); } catch (e) { mapError(res, e); }
});

// --- Orders ---
router.get('/orders', async (req, res) => {
  try { res.json(await admin.listAllOrders()); } catch (e) { mapError(res, e); }
});
router.patch('/orders/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try { res.json(await admin.updateOrderStatus(id, (req.body || {}).status)); } catch (e) { mapError(res, e); }
});

// --- Merchant config (secrets never returned in plaintext) ---
router.get('/config', async (req, res) => {
  try { res.json(await admin.listGatewayConfig()); } catch (e) { mapError(res, e); }
});
router.put('/config/:gateway', async (req, res) => {
  try { res.json(await admin.saveGatewayConfig(req.params.gateway, req.body || {})); } catch (e) { mapError(res, e); }
});

// --- Notifications & Heartbeat (Wave 6) ---
router.get('/notifications', async (req, res) => {
  try { res.json(await notifications.list({ type: req.query.type, limit: 100 })); } catch (e) { mapError(res, e); }
});
// Manually run the proactive heartbeat (low-stock/abandoned-cart/briefing) and return the briefing.
router.post('/heartbeat/run', async (req, res) => {
  try {
    const lowStock = await heartbeat.checkLowStock();
    const abandoned = await heartbeat.checkAbandonedCarts();
    const briefing = await heartbeat.dailyBriefing();
    res.json({ lowStock: lowStock.length, abandoned: abandoned.length, briefing: briefing.stats });
  } catch (e) { mapError(res, e); }
});
// Run the GDPR retention purge (DPR-0011) on demand and return purge counts.
router.post('/retention/run', async (req, res) => {
  try { res.json(await retention.purge()); } catch (e) { mapError(res, e); }
});

module.exports = router;
