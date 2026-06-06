// Named, allow-listed analytics queries (ADR-0012, RISK-0024).
// NO free-form SQL from the LLM. Each metric is a fixed parameterized query.
// Role scoping is enforced by the caller (ops route / tool ctx).
const { pool } = require('./../db');
const config = require('./../config');

const PERIOD_SQL = {
  today: "created_at >= date_trunc('day', now())",
  week: "created_at >= date_trunc('week', now())",
  month: "created_at >= date_trunc('month', now())",
  ytd: "created_at >= date_trunc('year', now())",
};

async function systemHealth() {
  const health = { status: 'ok', components: {}, version: '1.0.0-w0',
    openai: config.openai.apiKey ? 'configured' : 'missing-key',
    heartbeat: config.heartbeat.enabled ? config.heartbeat.cron : 'disabled' };
  try {
    await pool.query('SELECT 1');
    health.components.postgres = 'ok';
  } catch (e) {
    health.components.postgres = 'down';
    health.status = 'degraded';
  }
  return health;
}

async function businessMetric(metric, period = 'today', ctx = {}) {
  // Role scoping: only admins may read store-wide KPIs (AN-2).
  if (ctx.role && ctx.role !== 'admin') {
    const err = new Error('forbidden: business metrics require admin role');
    err.code = 'FORBIDDEN';
    throw err;
  }
  const window = PERIOD_SQL[period] || PERIOD_SQL.today;
  switch (metric) {
    case 'orders_count': {
      const { rows } = await pool.query(
        `SELECT count(*)::int AS value FROM orders WHERE ${window}`);
      return { metric, period, value: rows[0].value };
    }
    case 'revenue': {
      const { rows } = await pool.query(
        `SELECT COALESCE(sum(total_cents),0)::int AS value FROM orders
         WHERE status IN ('PAID','FULFILLED') AND ${window}`);
      return { metric, period, value: rows[0].value, unit: 'cents' };
    }
    case 'aov': {
      const { rows } = await pool.query(
        `SELECT COALESCE(avg(total_cents),0)::int AS value FROM orders
         WHERE status IN ('PAID','FULFILLED') AND ${window}`);
      return { metric, period, value: rows[0].value, unit: 'cents' };
    }
    case 'cart_abandonment': {
      const { rows } = await pool.query(
        `SELECT (SELECT count(*) FROM cart WHERE ${window})::int AS carts,
                (SELECT count(*) FROM orders WHERE ${window})::int AS orders`);
      const { carts, orders } = rows[0];
      const rate = carts > 0 ? Math.round((1 - orders / carts) * 100) : 0;
      return { metric, period, value: rate, unit: 'percent' };
    }
    case 'top_products': {
      const { rows } = await pool.query(
        `SELECT oi.sku, oi.name, sum(oi.quantity)::int AS qty
         FROM order_item oi JOIN orders o ON o.id = oi.order_id
         WHERE o.${window} GROUP BY oi.sku, oi.name ORDER BY qty DESC LIMIT 10`);
      return { metric, period, breakdown: rows };
    }
    case 'low_stock_count': {
      const { rows } = await pool.query(
        `SELECT count(*)::int AS value FROM product WHERE enabled=true AND stock < 5`);
      return { metric, period: 'now', value: rows[0].value };
    }
    case 'new_customers': {
      const { rows } = await pool.query(
        `SELECT count(*)::int AS value FROM app_user WHERE role='customer' AND ${window}`);
      return { metric, period, value: rows[0].value };
    }
    default: {
      const err = new Error(`unknown metric '${metric}'`);
      err.code = 'BAD_METRIC';
      throw err;
    }
  }
}

module.exports = { systemHealth, businessMetric };
