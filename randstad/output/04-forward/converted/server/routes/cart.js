// Cart REST routes (FS-0002, RULE-0001..0007). Rules + pricing live in ../cart.js so the
// UI and the agent tools share one server-authoritative implementation. Validation/stock
// failures return 422 (per api-specifications.yaml). Totals are always server-computed.
const express = require('express');
const cartService = require('./../cart');

const router = express.Router();

// Logged-in users persist (RULE-0006); fall back to session for safety.
function owner(req) {
  return { userId: req.user?.id || null, sessionKey: req.sessionID || null };
}

function handleError(res, e) {
  if (e.code === 'VALIDATION') return res.status(422).json({ error: e.message });
  return res.status(500).json({ error: e.message });
}

router.get('/', async (req, res) => {
  try { res.json(await cartService.getCart(owner(req))); }
  catch (e) { handleError(res, e); }
});

router.post('/items', async (req, res) => {
  const { sku, quantity = 1, options = {} } = req.body || {};
  if (!sku) return res.status(422).json({ error: 'sku required' });
  try { res.json(await cartService.addItem(owner(req), { sku, quantity, options })); }
  catch (e) { handleError(res, e); }
});

router.patch('/items/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const { quantity } = req.body || {};
  if (!Number.isInteger(itemId)) return res.status(422).json({ error: 'invalid itemId' });
  try { res.json(await cartService.updateItem(owner(req), { itemId, quantity })); }
  catch (e) { handleError(res, e); }
});

// Convenience: remove a line (equivalent to PATCH quantity=0).
router.delete('/items/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  if (!Number.isInteger(itemId)) return res.status(422).json({ error: 'invalid itemId' });
  try { res.json(await cartService.updateItem(owner(req), { itemId, quantity: 0 })); }
  catch (e) { handleError(res, e); }
});

module.exports = router;
