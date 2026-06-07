// Agent control-plane routes: sessions + ClawBands HITL approvals + audit view.
const express = require('express');
const { pool } = require('./../db');
const { getApproval, resolveApproval, enforce } = require('./../agent/clawbands');
const { byName } = require('./../agent/tools');
const { requireRole } = require('./../middleware/rbac');

const router = express.Router();

// Start an agent session (Gateway)
router.post('/sessions', async (req, res) => {
  const { rows } = await pool.query(
    `INSERT INTO agent_session (user_id, channel) VALUES ($1,'webchat') RETURNING id`,
    [req.user?.id || null]);
  res.status(201).json({ sessionId: rows[0].id });
});

// Execute a ShopiClaw tool by name (ADR-0005, ADR-0007).
// The CopilotKit OpenAIAdapter advertises tools to the LLM but does NOT run their
// handlers server-side — it emits the tool call to the client for execution. So the
// client registers these tools as frontend actions (useCopilotAction) that proxy
// here. Business logic + policy stay server-side: each call is validated against the
// tool's Zod schema and runs through ClawBands (audit + guarded-tool HITL approval),
// scoped to the authenticated session user. (/api/agent is behind requireAuth.)
router.post('/tool', async (req, res) => {
  const { name, args } = req.body || {};
  const tool = name && byName[name];
  if (!tool) return res.status(404).json({ error: `unknown tool: ${name}` });

  const ctx = {
    actor: req.user ? String(req.user.id) : 'anonymous',
    role: req.user?.role || 'customer',
    channel: 'webchat',
    sessionKey: req.sessionID || null,
  };

  let parsed;
  try {
    parsed = tool.parameters.parse(args || {});
  } catch (e) {
    return res.status(400).json({ error: `invalid arguments: ${e.message}` });
  }

  try {
    const result = await enforce(ctx, tool, parsed, tool.handler);
    return res.json({ ok: true, result });
  } catch (e) {
    // Guarded tools surface a HITL approval signal rather than executing (RISK-0015).
    if (e.code === 'APPROVAL_REQUIRED') {
      return res.json({
        ok: false,
        status: 'approval_required',
        approvalId: e.approvalId,
        message: `This action needs human approval (id ${e.approvalId}).`,
      });
    }
    if (e.code === 'FORBIDDEN') return res.status(403).json({ error: e.message });
    return res.status(400).json({ ok: false, status: 'error', error: e.message });
  }
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
