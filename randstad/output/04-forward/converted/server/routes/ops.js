// Ops routes: health/readiness + functional analytics (ADR-0012).
const express = require('express');
const { systemHealth, businessMetric } = require('./metricsQueries');
const { requireRole } = require('./../middleware/rbac');

const router = express.Router();

// Liveness (no auth) — mounted before auth in index.js
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Readiness — getSystemHealth backing
router.get('/ready', async (req, res) => {
  try {
    const h = await systemHealth();
    res.status(h.status === 'ok' ? 200 : 503).json(h);
  } catch (e) { res.status(503).json({ status: 'down', error: e.message }); }
});

// Business metrics — admin only (role-scoped, AN-2)
router.get('/metrics/business', requireRole('admin'), async (req, res) => {
  try {
    const result = await businessMetric(req.query.metric, req.query.period,
      { role: req.user.role, actor: String(req.user.id) });
    res.json(result);
  } catch (e) {
    const code = e.code === 'FORBIDDEN' ? 403 : (e.code === 'BAD_METRIC' ? 400 : 500);
    res.status(code).json({ error: e.message });
  }
});

module.exports = router;
