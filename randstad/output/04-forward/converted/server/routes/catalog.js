// Catalog REST routes (FS-0001). Read-only; server-authoritative data.
const express = require('express');
const { byName } = require('./../agent/tools');

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

module.exports = router;
