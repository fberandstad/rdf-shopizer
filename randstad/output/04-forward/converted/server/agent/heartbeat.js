// Heartbeat (OpenClaw-style proactive scheduler). Cheap deterministic checks first,
// escalate to the LLM only when something significant changes (cost control).
// W0 ships the scaffold + low-stock check; richer jobs land in later waves.
const cron = require('node-cron');
const { pool } = require('./../db');

let task = null;

async function checkLowStock() {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM product WHERE enabled=true AND stock < 5`);
  if (rows[0].n > 0) {
    console.log(`[heartbeat] low-stock alert: ${rows[0].n} product(s) below threshold`);
    // later: notify merchant / escalate to agent for a briefing
  }
}

async function tick() {
  try {
    await checkLowStock();
    // later waves: abandoned-cart nudges, order-status notifications, daily briefing
  } catch (e) {
    console.error('[heartbeat] tick error:', e.message);
  }
}

function start(schedule) {
  if (task) return;
  task = cron.schedule(schedule, tick);
  console.log(`[heartbeat] scheduled: ${schedule}`);
}

function stop() { if (task) { task.stop(); task = null; } }

module.exports = { start, stop, tick };
