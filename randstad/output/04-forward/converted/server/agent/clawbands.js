// ClawBands — tool-call policy + HITL approval gateway (ADR-0007, RISK-0015).
// Every tool invocation passes through here. Guarded tools require an approval
// record (decision=approved) before execution. All calls are audited.
const crypto = require('crypto');
const { pool } = require('./../db');
const config = require('./../config');

function isGuarded(toolName) {
  return config.agent.guardedTools.includes(toolName);
}

async function audit({ actor, channel, tool, sensitivity, approved, outcome, detail }) {
  try {
    await pool.query(
      `INSERT INTO tool_audit (actor, channel, tool, sensitivity, approved, outcome, detail)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [actor || null, channel || 'webchat', tool, sensitivity || 'read',
       approved ?? null, outcome || 'ok', detail || {}]
    );
  } catch (e) { console.error('[clawbands] audit failed:', e.message); }
}

// Create a pending approval for a guarded tool. UI/HITL resolves via /api/agent/approvals.
async function requestApproval({ actor, tool, args }) {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO tool_approval (id, actor, tool, args, decision) VALUES ($1,$2,$3,$4,'pending')`,
    [id, actor || null, tool, args || {}]
  );
  return id;
}

async function getApproval(id) {
  const { rows } = await pool.query('SELECT * FROM tool_approval WHERE id=$1', [id]);
  return rows[0] || null;
}

async function resolveApproval(id, decision) {
  await pool.query(
    `UPDATE tool_approval SET decision=$2, decided_at=now() WHERE id=$1`,
    [id, decision === 'approved' ? 'approved' : 'rejected']
  );
  return getApproval(id);
}

// Enforce policy around a tool handler. Read/write run directly (audited);
// guarded tools throw a structured "approval required" unless pre-approved.
async function enforce(ctx, tool, args, handler) {
  const sensitivity = isGuarded(tool.name) ? 'guarded'
    : (tool.sensitivity || 'read');

  if (sensitivity === 'guarded') {
    if (!ctx.approvalId) {
      const approvalId = await requestApproval({ actor: ctx.actor, tool: tool.name, args });
      await audit({ ...ctx, tool: tool.name, sensitivity, approved: false, outcome: 'pending',
        detail: { approvalId } });
      const err = new Error(`Tool '${tool.name}' requires human approval.`);
      err.code = 'APPROVAL_REQUIRED';
      err.approvalId = approvalId;
      throw err;
    }
    const appr = await getApproval(ctx.approvalId);
    if (!appr || appr.decision !== 'approved') {
      await audit({ ...ctx, tool: tool.name, sensitivity, approved: false, outcome: 'denied' });
      const err = new Error(`Approval ${ctx.approvalId} not granted.`);
      err.code = 'APPROVAL_DENIED';
      throw err;
    }
  }

  try {
    const result = await handler(args, ctx);
    await audit({ ...ctx, tool: tool.name, sensitivity, approved: true, outcome: 'ok' });
    return result;
  } catch (e) {
    await audit({ ...ctx, tool: tool.name, sensitivity, approved: true, outcome: 'error',
      detail: { message: e.message } });
    throw e;
  }
}

module.exports = { isGuarded, enforce, audit, requestApproval, getApproval, resolveApproval };
