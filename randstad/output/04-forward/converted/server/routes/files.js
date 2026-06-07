// Protected digital downloads (FS-0009, RULE-0015, TEST-0021).
// Allowed only for admins or customers who purchased the product (PAID order).
const express = require('express');
const content = require('./../content');

const router = express.Router();

router.get('/:sku', async (req, res) => {
  const owner = { userId: req.user?.id || null, admin: req.user?.role === 'admin' };
  try {
    const file = await content.authorizeDownload(owner, req.params.sku);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.sku}.txt"`);
    res.send(file.content);
  } catch (e) {
    const status = e.code === 'FORBIDDEN' ? 403 : e.code === 'NOT_FOUND' ? 404
      : e.code === 'VALIDATION' ? 422 : 500;
    res.status(status).json({ error: e.message });
  }
});

module.exports = router;
