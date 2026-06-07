// Newsletter subscription (FS-0007, TEST-0022). PII (email) + explicit consent.
const express = require('express');
const content = require('./../content');

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, consent } = req.body || {};
  try { res.status(201).json(await content.subscribe(email, consent !== false)); }
  catch (e) { res.status(e.code === 'VALIDATION' ? 422 : 500).json({ error: e.message }); }
});

// DPR-0008: consent withdrawal / unsubscribe (right to withdraw marketing consent).
router.post('/withdraw', async (req, res) => {
  const { email } = req.body || {};
  try { res.json(await content.withdrawConsent(email)); }
  catch (e) { res.status(e.code === 'VALIDATION' ? 422 : 500).json({ error: e.message }); }
});

module.exports = router;
