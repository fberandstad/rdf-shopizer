// Notification service (Wave 6). Replaces legacy EmailUtil/SMTP (conversion-patterns.md).
// Persists notifications + logs; a real email/SMS provider plugs in via `channel` later.
// Pure formatters are exported for unit tests. PII is minimized (no card data ever).
const { pool } = require('./db');

// --- Pure formatters (unit-tested) ---
function money(cents, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format((cents || 0) / 100);
}

function formatOrderConfirmation(order) {
  return {
    type: 'order_confirmation',
    recipient: order.customer_email || order.customerEmail || null,
    subject: `Order #${order.id} confirmed`,
    body: `Thank you! Your order #${order.id} totalling ${money(order.total_cents, order.currency)} is confirmed.`,
    meta: { orderId: order.id, total_cents: order.total_cents },
  };
}

function formatLowStock(items, threshold) {
  const skus = items.map(i => i.sku);
  return {
    type: 'low_stock', recipient: 'merchant',
    subject: `Low stock: ${items.length} product(s) below ${threshold}`,
    body: `Products at/under threshold (${threshold}): ${skus.join(', ')}.`,
    meta: { count: items.length, skus, threshold },
  };
}

function formatAbandonedCart(cart) {
  return {
    type: 'abandoned_cart', recipient: cart.email || 'customer',
    subject: 'You left items in your cart',
    body: `Your cart (${cart.itemCount} item(s)) is waiting. Complete your purchase any time.`,
    meta: { cartId: cart.id, itemCount: cart.itemCount },
  };
}

function formatBriefing(stats) {
  return {
    type: 'briefing', recipient: 'admin',
    subject: `Daily briefing — ${stats.orders} orders, ${money(stats.revenue)} revenue`,
    body: `Orders today: ${stats.orders}. Revenue: ${money(stats.revenue)}. ` +
      `Low-stock products: ${stats.lowStock}. New customers: ${stats.newCustomers}.` +
      (stats.escalate ? ' [escalation recommended]' : ''),
    meta: stats,
  };
}

// --- Persistence ---
async function send({ type, channel = 'log', recipient = null, subject, body, meta = {} }) {
  if (!type || !subject || !body) throw new Error('notification requires type, subject, body');
  const { rows } = await pool.query(
    `INSERT INTO notification (type, channel, recipient, subject, body, meta)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, type, channel, recipient, subject, created_at`,
    [type, channel, recipient, subject, body, meta]);
  console.log(`[notify] ${type} -> ${recipient || channel}: ${subject}`);
  return rows[0];
}

async function list({ type, limit = 50 } = {}) {
  const params = []; let where = '';
  if (type) { params.push(type); where = 'WHERE type=$1'; }
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT id, type, channel, recipient, subject, body, meta, created_at
     FROM notification ${where} ORDER BY id DESC LIMIT $${params.length}`, params);
  return rows;
}

module.exports = {
  formatOrderConfirmation, formatLowStock, formatAbandonedCart, formatBriefing, money,
  send, list,
};
