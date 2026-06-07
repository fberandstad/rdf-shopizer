// RAG admin routes (FS-0001 / ADR-0011). Re-index catalog and Twin knowledge.
// Admin-only; redaction (DPR-0009) runs inside ingestDocument before embedding.
const express = require('express');
const path = require('path');
const { ingestCatalog, ingestTwinKnowledge } = require('./../rag/ingest');
const { requireRole } = require('./../middleware/rbac');
const config = require('./../config');

const router = express.Router();

// Twin corpus root: randstad/output (00-twin, 02-reverse, 03-target live here).
const TWIN_ROOT = config.rag?.twinRoot || path.resolve(__dirname, './../../../..');

router.post('/ingest', requireRole('admin'), async (req, res) => {
  const scope = (req.body && req.body.scope) || 'all'; // catalog | twin | all
  if (!['catalog', 'twin', 'all'].includes(scope)) {
    return res.status(400).json({ error: 'scope must be catalog|twin|all' });
  }
  if (!config.openai.apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not set; embeddings unavailable' });
  }
  try {
    const result = {};
    if (scope === 'catalog' || scope === 'all') result.catalog = await ingestCatalog();
    if (scope === 'twin' || scope === 'all') result.twin = await ingestTwinKnowledge(TWIN_ROOT);
    res.json({ ok: true, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
