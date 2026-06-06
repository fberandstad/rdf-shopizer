// Order state machine (FS-0003/0004, RULE-0008..0014, RULE-0022).
// States: AWAITING_PAYMENT -> PAID  (failure rolls back so no completed order persists).
// Pricing is server-authoritative (RULE-0007, snapshotted from the cart). Payments are
// tokenized via the PSP adapter; the PAN never reaches ShopiClaw (RISK-0001, ADR-0006).
const { pool } = require('./db');
const config = require('./config');
const cartService = require('./cart');
const payments = require('./payments');

function validationError(message, code = 'VALIDATION') {
  const e = new Error(message); e.code = code; return e;
}

// RULE-0008: checkout requires customer context.
function assertCustomer(customer = {}) {
  const name = (customer.name || '').trim();
  const email = (customer.email || '').trim();
  if (!name) throw validationError('customer name required');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw validationError('valid customer email required');
  return { name, email };
}

// RULE-0014: never expose a full payment/transaction id.
function maskPaymentRef(ref) {
  if (!ref) return null;
  const tail = String(ref).slice(-4);
  return `••••${tail}`;
}

function orderView(order, items) {
  return {
    id: order.id,
    status: order.status,
    subtotal: order.subtotal_cents,
    tax: order.tax_cents,
    shipping: order.shipping_cents,
    total: order.total_cents,
    currency: order.currency,
    customer: { name: order.customer_name, email: order.customer_email },
    shipAddress: order.ship_address,
    payment: order.payment_ref
      ? { provider: order.payment_provider, ref: maskPaymentRef(order.payment_ref), paidAt: order.paid_at }
      : null,
    items: (items || []).map(i => ({
      sku: i.sku, name: i.name, quantity: i.quantity,
      unit_price_cents: i.unit_price_cents, line_total_cents: i.unit_price_cents * i.quantity,
    })),
    createdAt: order.created_at,
  };
}

async function loadOrder(id) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id=$1', [id]);
  return rows[0] || null;
}
async function loadOrderItems(id) {
  const { rows } = await pool.query('SELECT * FROM order_item WHERE order_id=$1 ORDER BY id', [id]);
  return rows;
}

// Confirmation hook (RULE-0022). Real SMTP integration is a later wave; we log + audit-safe.
function notifyOrderConfirmed(order) {
  console.log(`[orders] confirmation for order ${order.id} -> ${order.customer_email}`);
}

// Create an order in AWAITING_PAYMENT from the current cart. Cart is not cleared until paid.
async function createOrder(owner, { customer, shipAddress = {} }) {
  if (!owner.userId) throw validationError('login required to checkout');
  const cust = assertCustomer(customer);
  const cart = await cartService.getCart(owner);
  if (!cart.items.length) throw validationError('cart is empty');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, status, subtotal_cents, tax_cents, shipping_cents,
                           total_cents, currency, customer_email, customer_name, ship_address)
       VALUES ($1,'AWAITING_PAYMENT',$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [owner.userId, cart.subtotal, cart.tax, cart.shipping, cart.total, cart.currency,
       cust.email, cust.name, shipAddress]);
    const order = rows[0];
    for (const it of cart.items) {
      await client.query(
        `INSERT INTO order_item (order_id, product_id, sku, name, unit_price_cents, quantity)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.id, it.productId, it.sku, it.name, it.unit_price_cents, it.quantity]);
    }
    await client.query('COMMIT');
    return orderView(order, await loadOrderItems(order.id));
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Pay an order with a tokenized payment. On any failure the order is rolled back so that
// NO completed order is persisted (RULE-0012 / TEST-0014); the attempt is still auditable
// upstream via ClawBands. The PAN never reaches us (payments.charge enforces no-PAN).
async function payOrder(owner, { orderId, paymentToken, mode = 'authorizeAndCapture' }) {
  if (!owner.userId) throw validationError('login required');
  const order = await loadOrder(orderId);
  // RULE-0013: only the owner (or admin) may act on the order.
  if (!order || (order.user_id !== owner.userId && !owner.admin)) throw validationError('order not found', 'NOT_FOUND');
  if (order.status !== 'AWAITING_PAYMENT') throw validationError('order is not awaiting payment');

  // Tokenized charge (no-PAN enforced inside). Errors/declines => rollback the order.
  let result;
  try {
    result = await payments.charge({
      amountCents: order.total_cents, currency: order.currency, token: paymentToken, mode,
    });
  } catch (e) {
    if (e.code === 'PAN_REJECTED' || e.code === 'VALIDATION') throw e; // reject before any state change
    await rollbackOrder(order.id);
    const err = new Error('payment processing failed'); err.code = 'PAYMENT_ERROR'; throw err;
  }
  if (!result.ok) {
    await rollbackOrder(order.id); // RULE-0012: order not persisted on failure
    const err = new Error(`payment declined (${result.reason || 'declined'})`); err.code = 'PAYMENT_DECLINED'; throw err;
  }

  // Success path: persist PAID state, decrement stock, clear cart, send confirmation.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE orders SET status='PAID', payment_ref=$2, payment_provider=$3, paid_at=now() WHERE id=$1`,
      [order.id, result.transactionRef, config.psp.provider]);
    const items = await loadOrderItems(order.id);
    for (const it of items) {
      await client.query('UPDATE product SET stock = GREATEST(stock - $2, 0) WHERE id=$1', [it.product_id, it.quantity]);
    }
    // Clear the buyer's active cart (RULE-0006 lifecycle).
    await client.query(
      `DELETE FROM cart_item WHERE cart_id IN (SELECT id FROM cart WHERE user_id=$1)`, [owner.userId]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  const fresh = await loadOrder(order.id);
  notifyOrderConfirmed(fresh); // RULE-0022
  return orderView(fresh, await loadOrderItems(order.id));
}

async function rollbackOrder(orderId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM order_item WHERE order_id=$1', [orderId]);
    await client.query('DELETE FROM orders WHERE id=$1', [orderId]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

async function getOrder(owner, id) {
  const order = await loadOrder(id);
  if (!order || (order.user_id !== owner.userId && !owner.admin)) throw validationError('order not found', 'NOT_FOUND');
  return orderView(order, await loadOrderItems(id));
}

async function listOrders(owner) {
  if (!owner.userId) return [];
  const { rows } = await pool.query(
    `SELECT id, status, total_cents, currency, created_at, paid_at
     FROM orders WHERE user_id=$1 ORDER BY id DESC`, [owner.userId]);
  return rows.map(o => ({
    id: o.id, status: o.status, total: o.total_cents, currency: o.currency,
    createdAt: o.created_at, paidAt: o.paid_at,
  }));
}

module.exports = {
  createOrder, payOrder, getOrder, listOrders,
  assertCustomer, maskPaymentRef, // exported for unit tests
};
