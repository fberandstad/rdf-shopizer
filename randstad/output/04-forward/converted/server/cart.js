// Cart service (FS-0002). All pricing/totals are recomputed server-side (RULE-0007);
// client-supplied prices are never trusted. Business rules RULE-0001..0007 enforced here
// so both the REST routes and the agent tools share one authoritative implementation.
const { pool } = require('./db');
const config = require('./config');

function validationError(message) {
  const e = new Error(message);
  e.code = 'VALIDATION';
  return e;
}

// Canonical key for an option set so "same SKU + same options" merges (RULE-0005).
function optionsKey(options = {}) {
  const obj = options && typeof options === 'object' ? options : {};
  return JSON.stringify(Object.keys(obj).sort().reduce((a, k) => { a[k] = obj[k]; return a; }, {}));
}

// Pure totals computation (RULE-0007 / RULE-0019 simplified to a configurable rate).
// items: [{ unit_price_cents, quantity }]. Returns minor-unit integers.
function computeTotals(items, { taxRateBps = config.cart.taxRateBps, shippingCents = config.cart.flatShippingCents, currency = 'EUR' } = {}) {
  const subtotal_cents = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
  const tax_cents = Math.round((subtotal_cents * taxRateBps) / 10000);
  const shipping_cents = items.length > 0 ? shippingCents : 0;
  return {
    subtotal_cents,
    tax_cents,
    shipping_cents,
    total_cents: subtotal_cents + tax_cents + shipping_cents,
    currency,
  };
}

// Resolve (or create) the active cart for an owner. Logged-in users persist (RULE-0006);
// otherwise the cart is keyed by session.
async function resolveCart({ userId = null, sessionKey = null }) {
  if (!userId && !sessionKey) throw validationError('cart owner required');
  const sel = userId
    ? await pool.query('SELECT * FROM cart WHERE user_id=$1 ORDER BY id DESC LIMIT 1', [userId])
    : await pool.query('SELECT * FROM cart WHERE session_key=$1 ORDER BY id DESC LIMIT 1', [sessionKey]);
  if (sel.rows[0]) return sel.rows[0];
  const ins = await pool.query(
    'INSERT INTO cart (user_id, session_key) VALUES ($1,$2) RETURNING *',
    [userId, sessionKey]);
  return ins.rows[0];
}

async function loadItems(cartId) {
  const { rows } = await pool.query(
    `SELECT ci.id, ci.product_id, ci.quantity, ci.options,
            p.sku, p.name, p.price_cents AS unit_price_cents, p.currency, p.stock
     FROM cart_item ci JOIN product p ON p.id = ci.product_id
     WHERE ci.cart_id = $1 ORDER BY ci.id`, [cartId]);
  return rows;
}

function toView(cart, items) {
  const totals = computeTotals(items, { currency: items[0]?.currency || 'EUR' });
  return {
    id: cart.id,
    items: items.map(i => ({
      id: i.id,
      productId: i.product_id,
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      options: i.options,
      unit_price_cents: i.unit_price_cents,
      line_total_cents: i.unit_price_cents * i.quantity,
    })),
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: totals.subtotal_cents,
    tax: totals.tax_cents,
    shipping: totals.shipping_cents,
    total: totals.total_cents,
    currency: totals.currency,
  };
}

async function getCart(owner) {
  const cart = await resolveCart(owner);
  return toView(cart, await loadItems(cart.id));
}

async function addItem(owner, { sku, quantity = 1, options = {} }) {
  // RULE-0003: positive integer quantity.
  if (!Number.isInteger(quantity) || quantity <= 0) throw validationError('quantity must be a positive integer');

  // RULE-0001: product must exist and be enabled.
  const { rows: prows } = await pool.query(
    'SELECT id, sku, stock, attributes FROM product WHERE sku=$1 AND enabled=true', [sku]);
  const product = prows[0];
  if (!product) throw validationError('product not found or unavailable');

  // RULE-0002: required attributes/options must be provided.
  const required = Array.isArray(product.attributes?.requiredOptions) ? product.attributes.requiredOptions : [];
  for (const key of required) {
    if (options[key] === undefined || options[key] === null || options[key] === '') {
      throw validationError(`missing required option: ${key}`);
    }
  }

  const cart = await resolveCart(owner);
  const items = await loadItems(cart.id);

  // RULE-0005: merge same SKU + same option set into one line.
  const existing = items.find(i => i.product_id === product.id && optionsKey(i.options) === optionsKey(options));
  const newQtyForLine = (existing ? existing.quantity : 0) + quantity;

  // RULE-0004: stock availability check.
  if (product.stock < newQtyForLine) throw validationError('insufficient stock');

  if (existing) {
    await pool.query('UPDATE cart_item SET quantity=$2 WHERE id=$1', [existing.id, newQtyForLine]);
  } else {
    await pool.query(
      'INSERT INTO cart_item (cart_id, product_id, quantity, options) VALUES ($1,$2,$3,$4)',
      [cart.id, product.id, quantity, options]);
  }
  return toView(cart, await loadItems(cart.id)); // RULE-0007: recomputed totals
}

async function updateItem(owner, { itemId, quantity }) {
  const cart = await resolveCart(owner);
  const { rows } = await pool.query('SELECT * FROM cart_item WHERE id=$1 AND cart_id=$2', [itemId, cart.id]);
  if (!rows[0]) throw validationError('cart item not found');

  if (quantity === 0) {
    await pool.query('DELETE FROM cart_item WHERE id=$1', [itemId]);
  } else {
    if (!Number.isInteger(quantity) || quantity < 0) throw validationError('quantity must be a non-negative integer');
    const { rows: prows } = await pool.query('SELECT stock FROM product WHERE id=$1', [rows[0].product_id]);
    if ((prows[0]?.stock ?? 0) < quantity) throw validationError('insufficient stock');
    await pool.query('UPDATE cart_item SET quantity=$2 WHERE id=$1', [itemId, quantity]);
  }
  return toView(cart, await loadItems(cart.id));
}

function ownerFromCtx(ctx = {}) {
  const userId = /^\d+$/.test(String(ctx.actor)) ? Number(ctx.actor) : null;
  return { userId, sessionKey: ctx.sessionKey || (userId ? null : String(ctx.actor || 'anonymous')) };
}

// --- Shipping methods (FS-0003, TEST-0010) — server-authoritative, selectable at checkout.
function shippingOptions() {
  return Object.entries(config.cart.shippingMethods).map(([code, m]) => ({
    code, label: m.label, cents: m.cents,
  }));
}

// Resolve the cost (minor units) for a chosen method code; rejects unknown codes (RULE-0007).
function shippingCostFor(method) {
  const code = String(method || config.cart.defaultShippingMethod).toUpperCase();
  const m = config.cart.shippingMethods[code];
  if (!m) throw validationError(`unknown shipping method: ${code}`);
  return { code, cents: m.cents };
}

module.exports = {
  computeTotals, optionsKey, resolveCart, getCart, addItem, updateItem, ownerFromCtx,
  shippingOptions, shippingCostFor,
};
