// Order read routes (FS-0005, RULE-0013/0014). Owner-scoped; payment data is masked.
const express = require('express');
const orders = require('./../orders');
const content = require('./../content');

const router = express.Router();

function owner(req) {
  return { userId: req.user?.id || null, admin: req.user?.role === 'admin' };
}

router.get('/', async (req, res) => {
  try { res.json(await orders.listOrders(owner(req))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Invoice summary (FS-0005, RULE-0014/0020): line items, totals, masked payment,
// store-supported cards. Registered before /:id so it is not shadowed.
router.get('/:id/invoice', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(422).json({ error: 'invalid order id' });
  try { res.json(await content.getInvoice(owner(req), id)); }
  catch (e) {
    if (e.code === 'NOT_FOUND') return res.status(404).json({ error: e.message });
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(422).json({ error: 'invalid order id' });
  try { res.json(await orders.getOrder(owner(req), id)); }
  catch (e) {
    if (e.code === 'NOT_FOUND') return res.status(404).json({ error: e.message });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
