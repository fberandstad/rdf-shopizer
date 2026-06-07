// Catalog REST routes (FS-0001) + product reviews (FS-0006). Server-authoritative data.
const express = require('express');
const { byName } = require('./../agent/tools');
const content = require('./../content');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const rows = await byName.searchCatalog.handler({
      q: req.query.q, categoryCode: req.query.categoryId,
    });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/products/:sku', async (req, res) => {
  try {
    const product = await byName.getProduct.handler({ sku: req.params.sku });
    res.json(product);
  } catch (e) { res.status(404).json({ error: e.message }); }
});

router.get('/categories', async (req, res) => {
  try {
    res.json(await byName.listCategories.handler({}));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Product reviews (FS-0006, TEST-0020) ---
router.get('/products/:sku/reviews', async (req, res) => {
  try { res.json(await content.listReviews(req.params.sku)); }
  catch (e) { res.status(e.code === 'NOT_FOUND' ? 404 : 500).json({ error: e.message }); }
});

router.post('/products/:sku/reviews', async (req, res) => {
  try { res.status(201).json(await content.submitReview(req.user?.id || null, req.params.sku, req.body || {})); }
  catch (e) {
    const status = e.code === 'AUTH' ? 401 : e.code === 'NOT_FOUND' ? 404
      : e.code === 'VALIDATION' ? 422 : 500;
    res.status(status).json({ error: e.message });
  }
});

module.exports = router;
