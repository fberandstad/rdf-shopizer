// Heartbeat (OpenClaw-style proactive scheduler). Cheap deterministic checks first,
// escalate to the LLM only when something significant changes (cost control).
// Jobs: low-stock alert, abandoned-cart nudge, daily briefing. Each emits a notification.
const cron = require('node-cron');
const { pool } = require('./../db');
const config = require('./../config');
const notifications = require('./../notifications');

let task = null;

// --- Pure decision helpers (unit-tested; no DB/LLM) ---
// A cart is abandoned if it has items and its last activity is older than the threshold.
function isAbandoned(createdAt, now, thresholdHours) {
  const ageMs = now.getTime() - new Date(createdAt).getTime();
  return ageMs >= thresholdHours * 3600 * 1000;
}

// Escalate to the LLM briefing only on a significant signal (cost control). Deterministic.
function shouldEscalate(stats) {
  return (stats.lowStock || 0) > 0 || (stats.abandoned || 0) >= 3 || (stats.orders || 0) === 0;
}

// --- DB-backed checks ---
async function checkLowStock() {
  const threshold = config.heartbeat.lowStockThreshold;
  const { rows } = await pool.query(
    `SELECT sku, name, stock FROM product WHERE enabled=true AND stock < $1 ORDER BY stock ASC`,
    [threshold]);
  if (rows.length) await notifications.send(notifications.formatLowStock(rows, threshold));
  return rows;
}

async function checkAbandonedCarts() {
  const hours = config.heartbeat.abandonedCartHours;
  // Carts with items, owned by a user who has NO order, older than the threshold.
  const { rows } = await pool.query(
    `SELECT c.id, c.created_at, u.email, count(ci.id)::int AS item_count
     FROM cart c JOIN cart_item ci ON ci.cart_id = c.id
     LEFT JOIN app_user u ON u.id = c.user_id
     WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = c.user_id)
     GROUP BY c.id, c.created_at, u.email
     HAVING c.created_at < now() - ($1 || ' hours')::interval`, [String(hours)]);
  const now = new Date();
  const abandoned = rows.filter(r => isAbandoned(r.created_at, now, hours));
  for (const c of abandoned) {
    await notifications.send(notifications.formatAbandonedCart(
      { id: c.id, email: c.email, itemCount: c.item_count }));
  }
  return abandoned;
}

async function dailyBriefing() {
  const q = async (sql, p = []) => (await pool.query(sql, p)).rows[0].v;
  const orders = await q(`SELECT count(*)::int AS v FROM orders WHERE created_at >= date_trunc('day', now())`);
  const revenue = await q(`SELECT COALESCE(sum(total_cents),0)::int AS v FROM orders
                           WHERE status IN ('PAID','FULFILLED') AND created_at >= date_trunc('day', now())`);
  const lowStock = await q(`SELECT count(*)::int AS v FROM product WHERE enabled=true AND stock < $1`,
    [config.heartbeat.lowStockThreshold]);
  const newCustomers = await q(`SELECT count(*)::int AS v FROM app_user
                                WHERE role='customer' AND created_at >= date_trunc('day', now())`);
  const stats = { orders, revenue, lowStock, newCustomers, abandoned: 0 };
  stats.escalate = shouldEscalate(stats); // later: trigger an LLM-written briefing when true
  const note = await notifications.send(notifications.formatBriefing(stats));
  return { stats, notification: note };
}

async function tick() {
  try {
    await checkLowStock();
    await checkAbandonedCarts();
    await dailyBriefing();
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

module.exports = {
  start, stop, tick,
  isAbandoned, shouldEscalate,                 // pure (unit-tested)
  checkLowStock, checkAbandonedCarts, dailyBriefing,
};
