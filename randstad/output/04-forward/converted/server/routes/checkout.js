// Checkout REST routes (FS-0003/0004, RULE-0008..0012). The order state machine + rules
// live in ../orders.js (shared with the agent tools). On this human-present path the user
// is the actor, so payment executes directly but is still audited (ClawBands). The agent
// path for payOrder is guarded and requires explicit HITL approval.
const express = require('express');
const orders = require('./../orders');
const cartService = require('./../cart');
const { audit } = require('./../agent/clawbands');

const router = express.Router();

function owner(req) {
  return { userId: req.user?.id || null, admin: req.user?.role === 'admin', sessionKey: req.sessionID || null };
}

function mapError(res, e) {
  switch (e.code) {
    case 'VALIDATION': return res.status(422).json({ error: e.message });
    case 'PAN_REJECTED': return res.status(422).json({ error: e.message });
    case 'NOT_FOUND': return res.status(404).json({ error: e.message });
    case 'PAYMENT_DECLINED':
    case 'PAYMENT_ERROR': return res.status(402).json({ error: e.message });
    default: return res.status(500).json({ error: e.message });
  }
}

// Available shipping methods (TEST-0010). GET lists options; the client selects one for /order.
router.get('/shipping', (req, res) => {
  res.json({ options: cartService.shippingOptions(), currency: 'EUR' });
});

router.post('/order', async (req, res) => {
  const { customer, shipAddress = {}, shippingMethod } = req.body || {};
  try { res.status(201).json(await orders.createOrder(owner(req), { customer, shipAddress, shippingMethod })); }
  catch (e) { mapError(res, e); }
});

router.post('/pay', async (req, res) => {
  const { orderId, paymentToken, mode } = req.body || {};
  const o = owner(req);
  try {
    const result = await orders.payOrder(o, { orderId, paymentToken, mode });
    await audit({ actor: String(o.userId), channel: 'web', tool: 'payOrder',
      sensitivity: 'guarded', approved: true, outcome: 'ok', detail: { orderId } });
    res.json(result);
  } catch (e) {
    await audit({ actor: String(o.userId), channel: 'web', tool: 'payOrder',
      sensitivity: 'guarded', approved: true, outcome: 'error', detail: { orderId, code: e.code } });
    mapError(res, e);
  }
});

module.exports = router;
