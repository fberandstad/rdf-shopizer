// Admin service (Wave 5: FS-0011/0012/0013/0014, RULE-0016..0020).
// Catalog/inventory CRUD, order management, and merchant gateway config with secrets
// encrypted at rest. Pure validators + the order state machine are exported for unit tests.
// Authorization (admin role) is enforced at the route/tool layer (RBAC + ClawBands).
const { pool } = require('./db');
const { encryptSecret, maskSecret } = require('./crypto');

function err(message, code = 'VALIDATION') { const e = new Error(message); e.code = code; return e; }

// --- Catalog (FS-0011) ---
function assertProduct(p = {}, { partial = false } = {}) {
  const out = {};
  if (!partial || p.sku !== undefined) {
    if (!String(p.sku || '').trim()) throw err('sku required');
    out.sku = p.sku.trim();
  }
  if (!partial || p.name !== undefined) {
    if (!String(p.name || '').trim()) throw err('name required');
    out.name = p.name.trim();
  }
  if (!partial || p.priceCents !== undefined) {
    const c = Number(p.priceCents);
    if (!Number.isInteger(c) || c < 0) throw err('priceCents must be a non-negative integer');
    out.priceCents = c;
  }
  if (p.stock !== undefined) {
    const s = Number(p.stock);
    if (!Number.isInteger(s) || s < 0) throw err('stock must be a non-negative integer');
    out.stock = s;
  }
  if (p.description !== undefined) out.description = String(p.description);
  if (p.categoryCode !== undefined) out.categoryCode = p.categoryCode ? String(p.categoryCode) : null;
  if (p.enabled !== undefined) out.enabled = !!p.enabled;
  return out;
}

async function categoryIdByCode(code) {
  if (!code) return null;
  const { rows } = await pool.query('SELECT id FROM category WHERE code=$1', [code]);
  if (!rows[0]) throw err('category not found', 'VALIDATION');
  return rows[0].id;
}

async function createProduct(input) {
  const v = assertProduct(input);
  const exists = await pool.query('SELECT 1 FROM product WHERE sku=$1', [v.sku]);
  if (exists.rowCount) throw err('sku already exists', 'CONFLICT');
  const categoryId = await categoryIdByCode(v.categoryCode);
  const { rows } = await pool.query(
    `INSERT INTO product (sku, name, description, price_cents, category_id, stock, enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [v.sku, v.name, v.description || null, v.priceCents, categoryId, v.stock ?? 0, v.enabled ?? true]);
  return rows[0];
}

async function updateProduct(sku, input) {
  const v = assertProduct({ ...input, sku }, { partial: true });
  const sets = [], params = [sku];
  const map = { name: 'name', description: 'description', priceCents: 'price_cents',
    stock: 'stock', enabled: 'enabled' };
  for (const [k, col] of Object.entries(map)) {
    if (v[k] !== undefined) { params.push(v[k]); sets.push(`${col}=$${params.length}`); }
  }
  if (input.categoryCode !== undefined) {
    const cid = await categoryIdByCode(input.categoryCode);
    params.push(cid); sets.push(`category_id=$${params.length}`);
  }
  if (!sets.length) throw err('no fields to update');
  const { rows } = await pool.query(
    `UPDATE product SET ${sets.join(', ')} WHERE sku=$1 RETURNING *`, params);
  if (!rows[0]) throw err('product not found', 'NOT_FOUND');
  return rows[0];
}

// --- Inventory (RULE-0004 support) ---
async function adjustStock(sku, delta) {
  const d = Number(delta);
  if (!Number.isInteger(d)) throw err('delta must be an integer');
  const { rows } = await pool.query(
    `UPDATE product SET stock = GREATEST(stock + $2, 0) WHERE sku=$1 RETURNING sku, stock`, [sku, d]);
  if (!rows[0]) throw err('product not found', 'NOT_FOUND');
  return rows[0];
}

async function createCategory({ code, name, parentCode } = {}) {
  if (!String(code || '').trim()) throw err('code required');
  if (!String(name || '').trim()) throw err('name required');
  const parentId = parentCode ? await categoryIdByCode(parentCode) : null;
  const { rows } = await pool.query(
    `INSERT INTO category (code, name, parent_id) VALUES ($1,$2,$3)
     ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name RETURNING *`,
    [code.trim(), name.trim(), parentId]);
  return rows[0];
}

// --- Orders (FS-0012) — admin state machine (RULE-0012 forward transitions) ---
const ORDER_TRANSITIONS = {
  AWAITING_PAYMENT: ['CANCELLED'],
  PAID: ['FULFILLED', 'CANCELLED'],
  FULFILLED: [],
  CANCELLED: [],
  CREATED: ['AWAITING_PAYMENT', 'CANCELLED'],
};
function canTransition(from, to) {
  return (ORDER_TRANSITIONS[from] || []).includes(to);
}

async function listAllOrders() {
  const { rows } = await pool.query(
    `SELECT id, user_id, status, total_cents, currency, created_at, paid_at
     FROM orders ORDER BY id DESC LIMIT 200`);
  return rows;
}

async function updateOrderStatus(orderId, to) {
  const { rows } = await pool.query('SELECT id, status FROM orders WHERE id=$1', [orderId]);
  const o = rows[0];
  if (!o) throw err('order not found', 'NOT_FOUND');
  if (!canTransition(o.status, to)) throw err(`cannot transition ${o.status} -> ${to}`, 'INVALID_TRANSITION');
  const upd = await pool.query('UPDATE orders SET status=$2 WHERE id=$1 RETURNING id, status', [orderId, to]);
  return upd.rows[0];
}

// --- Merchant config (FS-0013/0014, RULE-0018) — secrets encrypted at rest, masked on read ---
async function saveGatewayConfig(gateway, { enabled, mode, secret, settings = {} } = {}) {
  if (!String(gateway || '').trim()) throw err('gateway required');
  const secretEnc = secret ? encryptSecret(secret) : null;
  const { rows } = await pool.query(
    `INSERT INTO merchant_config (gateway, enabled, mode, secret_encrypted, settings, updated_at)
     VALUES ($1,$2,$3,$4,$5, now())
     ON CONFLICT (gateway) DO UPDATE SET enabled=EXCLUDED.enabled, mode=EXCLUDED.mode,
       secret_encrypted=COALESCE(EXCLUDED.secret_encrypted, merchant_config.secret_encrypted),
       settings=EXCLUDED.settings, updated_at=now()
     RETURNING gateway, enabled, mode, settings, secret_encrypted, updated_at`,
    [gateway.trim(), !!enabled, mode || null, secretEnc, settings]);
  return viewConfig(rows[0], secret);
}

// Read config WITHOUT exposing the stored secret (RULE-0018). 'hasSecret' + masked hint only.
function viewConfig(row, plaintextForMaskHint) {
  return {
    gateway: row.gateway, enabled: row.enabled, mode: row.mode, settings: row.settings,
    hasSecret: !!row.secret_encrypted,
    secretMask: plaintextForMaskHint ? maskSecret(plaintextForMaskHint) : (row.secret_encrypted ? '••••••••' : null),
    updatedAt: row.updated_at,
  };
}

async function listGatewayConfig() {
  const { rows } = await pool.query('SELECT * FROM merchant_config ORDER BY gateway');
  return rows.map(r => viewConfig(r));
}

module.exports = {
  assertProduct, canTransition, ORDER_TRANSITIONS, // pure (unit-tested)
  createProduct, updateProduct, adjustStock, createCategory,
  listAllOrders, updateOrderStatus,
  saveGatewayConfig, listGatewayConfig,
};
