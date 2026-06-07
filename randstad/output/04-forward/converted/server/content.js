// Reviews, newsletter, invoice and gated downloads (FS-0005/0006/0007/0009).
const { pool } = require('./db');
const { maskPaymentRef } = require('./orders');

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function err(message, code = 'VALIDATION') { const e = new Error(message); e.code = code; return e; }

// Supported credit cards are per-store (RULE-0020). Static for the single ShopiClaw store;
// becomes store-scoped config when multi-store lands.
function supportedCards() { return ['VISA', 'MASTERCARD', 'AMEX']; }

// --- Reviews (FS-0006) ---
function assertReview({ rating, title, body } = {}) {
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) throw err('rating must be an integer 1-5');
  if (title && String(title).length > 120) throw err('title too long');
  return { rating: r, title: title ? String(title).trim() : null, body: body ? String(body).trim() : null };
}

async function productIdBySku(sku) {
  const { rows } = await pool.query('SELECT id FROM product WHERE sku=$1', [sku]);
  return rows[0]?.id || null;
}

async function listReviews(sku) {
  const pid = await productIdBySku(sku);
  if (!pid) throw err('product not found', 'NOT_FOUND');
  const { rows } = await pool.query(
    `SELECT r.rating, r.title, r.body, r.created_at, u.name AS author
     FROM product_review r JOIN app_user u ON u.id = r.user_id
     WHERE r.product_id=$1 ORDER BY r.id DESC`, [pid]);
  const avg = rows.length ? rows.reduce((s, x) => s + x.rating, 0) / rows.length : null;
  return { count: rows.length, average: avg, reviews: rows };
}

async function submitReview(userId, sku, input) {
  if (!userId) throw err('login required', 'AUTH');
  const v = assertReview(input);
  const pid = await productIdBySku(sku);
  if (!pid) throw err('product not found', 'NOT_FOUND');
  // One review per customer per product; re-submitting updates it (tied to product+customer).
  const { rows } = await pool.query(
    `INSERT INTO product_review (product_id, user_id, rating, title, body)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (product_id, user_id) DO UPDATE SET rating=EXCLUDED.rating,
       title=EXCLUDED.title, body=EXCLUDED.body, created_at=now()
     RETURNING rating, title, body, created_at`,
    [pid, userId, v.rating, v.title, v.body]);
  return rows[0];
}

// --- Newsletter (FS-0007) — PII + explicit consent ---
async function subscribe(email, consent = true) {
  const e = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(e)) throw err('valid email required');
  if (!consent) throw err('consent required');
  await pool.query(
    `INSERT INTO newsletter_subscriber (email, consent) VALUES ($1,$2)
     ON CONFLICT (email) DO UPDATE SET consent=EXCLUDED.consent`, [e, consent]);
  return { ok: true };
}

// --- Invoice (FS-0005, RULE-0014/0020) ---
async function getInvoice(owner, orderId) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id=$1', [orderId]);
  const o = rows[0];
  if (!o || (o.user_id !== owner.userId && !owner.admin)) throw err('order not found', 'NOT_FOUND');
  const { rows: items } = await pool.query('SELECT * FROM order_item WHERE order_id=$1 ORDER BY id', [orderId]);
  return {
    orderId: o.id, status: o.status, currency: o.currency,
    customer: { name: o.customer_name, email: o.customer_email },
    items: items.map(i => ({ sku: i.sku, name: i.name, quantity: i.quantity,
      unit_price_cents: i.unit_price_cents, line_total_cents: i.unit_price_cents * i.quantity })),
    subtotal: o.subtotal_cents, tax: o.tax_cents, shipping: o.shipping_cents, total: o.total_cents,
    payment: o.payment_ref ? { ref: maskPaymentRef(o.payment_ref), provider: o.payment_provider } : null,
    supportedCards: supportedCards(),
  };
}

// --- Digital download authorization (FS-0009, RULE-0015) ---
// Admins may always download; a customer may download a digital product only if they have a
// PAID order containing it. Pure helper is unit-tested; the route wires DB lookups to it.
function canDownload({ role, isAdmin, hasPaidOrderWithProduct }) {
  if (isAdmin || role === 'admin') return true;
  return !!hasPaidOrderWithProduct;
}

async function authorizeDownload(owner, sku) {
  const { rows } = await pool.query('SELECT id, name, digital, download_path FROM product WHERE sku=$1', [sku]);
  const p = rows[0];
  if (!p) throw err('product not found', 'NOT_FOUND');
  if (!p.digital) throw err('product is not a digital download', 'VALIDATION');
  let purchased = false;
  if (owner.userId) {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM order_item oi JOIN orders o ON o.id = oi.order_id
       WHERE oi.product_id=$1 AND o.user_id=$2 AND o.status='PAID' LIMIT 1`, [p.id, owner.userId]);
    purchased = rowCount > 0;
  }
  if (!canDownload({ isAdmin: owner.admin, hasPaidOrderWithProduct: purchased })) {
    throw err('download requires purchase or admin role', 'FORBIDDEN');
  }
  return { name: p.name, downloadPath: p.download_path, content: `ShopiClaw digital asset: ${p.name}\n` };
}

module.exports = {
  supportedCards, assertReview, canDownload, // pure (unit-tested)
  listReviews, submitReview, subscribe, getInvoice, authorizeDownload,
};
