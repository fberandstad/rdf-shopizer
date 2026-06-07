// Data-retention purge (Wave 7 — DPR-0011). Auto-deletes data past its retention window:
// agent conversation logs, tool audit (kept longer for accountability), notifications.
// Order data is NOT purged here (legal/tax retention). Pure window helper is unit-tested.
const { pool } = require('./db');
const config = require('./config');

// Pure: build the cutoff timestamp for a retention window (days before `now`).
function cutoff(now, days) {
  return new Date(now.getTime() - days * 24 * 3600 * 1000);
}

async function purge(now = new Date()) {
  const r = config.retention;
  const purged = {};
  const run = async (key, sql, days) => {
    const res = await pool.query(sql, [cutoff(now, days).toISOString()]);
    purged[key] = res.rowCount;
  };
  await run('agentMessages', `DELETE FROM agent_message WHERE created_at < $1`, r.agentMessageDays);
  await run('toolAudit', `DELETE FROM tool_audit WHERE ts < $1`, r.toolAuditDays);
  await run('notifications', `DELETE FROM notification WHERE created_at < $1`, r.notificationDays);
  console.log('[retention] purged', JSON.stringify(purged));
  return purged;
}

module.exports = { purge, cutoff };
