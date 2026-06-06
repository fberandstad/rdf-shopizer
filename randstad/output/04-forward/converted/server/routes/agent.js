// Agent control-plane routes: sessions + ClawBands HITL approvals + audit view.
const express = require('express');
const { pool } = require('./../db');
const { getApproval, resolveApproval } = require('./../agent/clawbands');
const { requireRole } = require('./../middleware/rbac');

const router = express.Router();

// Start an agent session (Gateway)
router.post('/sessions', async (req, res) => {
  const { rows } = await pool.query(
    `INSERT INTO agent_session (user_id, channel) VALUES ($1,'webchat') RETURNING id`,
    [req.user?.id || null]);
  res.status(201).json({ sessionId: rows[0].id });
});

// List pending guarded-tool approvals (admin HITL queue)
router.get('/approvals', requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, actor, tool, args, decision, created_at FROM tool_approval
     WHERE decision='pending' ORDER BY created_at DESC LIMIT 100`);
  res.json(rows);
});

// Resolve a guarded-tool approval (ClawBands HITL) — admin only
router.post('/approvals/:approvalId', requireRole('admin'), async (req, res) => {
  const { decision } = req.body || {};
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approved|rejected' });
  }
  const current = await getApproval(req.params.approvalId);
  if (!current) return res.status(404).json({ error: 'approval not found' });
  const updated = await resolveApproval(req.params.approvalId, decision);
  res.json(updated);
});

module.exports = router;
