// Customer account routes (FS-0006, TEST-0019). All owner-scoped via session user.
const express = require('express');
const account = require('./../account');
const gdpr = require('./../gdpr');

const router = express.Router();

function uid(req) { return req.user?.id || null; }
function mapError(res, e) {
  const status = e.code === 'VALIDATION' ? 422 : e.code === 'NOT_FOUND' ? 404 : 500;
  res.status(status).json({ error: e.message });
}

router.get('/profile', async (req, res) => {
  try { res.json(await account.getProfile(uid(req))); } catch (e) { mapError(res, e); }
});

router.put('/profile', async (req, res) => {
  try { res.json(await account.updateProfile(uid(req), req.body || {})); } catch (e) { mapError(res, e); }
});

router.get('/addresses', async (req, res) => {
  try { res.json(await account.listAddresses(uid(req))); } catch (e) { mapError(res, e); }
});

router.post('/addresses', async (req, res) => {
  try { res.status(201).json(await account.addAddress(uid(req), req.body || {})); } catch (e) { mapError(res, e); }
});

router.put('/addresses/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try { res.json(await account.updateAddress(uid(req), id, req.body || {})); } catch (e) { mapError(res, e); }
});

router.delete('/addresses/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try { res.json(await account.removeAddress(uid(req), id)); } catch (e) { mapError(res, e); }
});

// --- GDPR data-subject rights (Wave 7) ---
// DPR-0005: access/portability — export everything we hold about the subject.
router.get('/export', async (req, res) => {
  try {
    const data = await gdpr.exportData(uid(req));
    res.setHeader('Content-Disposition', 'attachment; filename="my-data.json"');
    res.json(data);
  } catch (e) { mapError(res, e); }
});

// DPR-0006: erasure ("right to be forgotten"). Cascades to logs + pgvector memory,
// anonymizes retained orders, then ends the session.
router.delete('/', async (req, res) => {
  try {
    const result = await gdpr.eraseUser(uid(req));
    req.session.destroy(() => res.json({ ok: true, ...result }));
  } catch (e) { mapError(res, e); }
});

module.exports = router;
