// Optional dev seed: a few categories/products so the storefront + agent have data.
// Run: node seed.js  (after migrations have created the schema)
const { pool } = require('./db');

const CATEGORIES = [
  { code: 'electronics', name: 'Electronics' },
  { code: 'books', name: 'Books' },
  { code: 'home', name: 'Home & Garden' },
];

const PRODUCTS = [
  { sku: 'EL-001', name: 'Wireless Headphones', price_cents: 7999, category: 'electronics', stock: 25 },
  { sku: 'EL-002', name: 'USB-C Charger 65W', price_cents: 2999, category: 'electronics', stock: 3 },
  { sku: 'BK-001', name: 'The Pragmatic Programmer', price_cents: 3499, category: 'books', stock: 40 },
  { sku: 'HM-001', name: 'Ceramic Plant Pot', price_cents: 1499, category: 'home', stock: 12 },
  // Digital product (FS-0009): download is role/purchase gated (RULE-0015).
  { sku: 'DL-001', name: 'Clean Code (eBook)', price_cents: 1999, category: 'books', stock: 999,
    digital: true, download_path: 'assets/clean-code.pdf' },
];

async function seed() {
  const catId = {};
  for (const c of CATEGORIES) {
    const { rows } = await pool.query(
      `INSERT INTO category (code, name) VALUES ($1,$2)
       ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name RETURNING id`, [c.code, c.name]);
    catId[c.code] = rows[0].id;
  }
  for (const p of PRODUCTS) {
    await pool.query(
      `INSERT INTO product (sku, name, price_cents, category_id, stock, digital, download_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (sku) DO UPDATE SET name=EXCLUDED.name, price_cents=EXCLUDED.price_cents,
         category_id=EXCLUDED.category_id, stock=EXCLUDED.stock,
         digital=EXCLUDED.digital, download_path=EXCLUDED.download_path`,
      [p.sku, p.name, p.price_cents, catId[p.category], p.stock, !!p.digital, p.download_path || null]);
  }
  console.log(`[seed] ${CATEGORIES.length} categories, ${PRODUCTS.length} products`);
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { seed };
