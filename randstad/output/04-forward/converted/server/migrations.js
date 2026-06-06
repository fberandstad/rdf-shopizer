// Schema migrations run automatically on server startup.
// Derived from the Stage 2 glossary (81 Hibernate entities) — W0 subset + agentic tables.
const { pool } = require('./db');

const STATEMENTS = [
  `CREATE EXTENSION IF NOT EXISTS vector`,

  // --- Identity / RBAC ---
  `CREATE TABLE IF NOT EXISTS app_user (
     id SERIAL PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     name TEXT,
     role TEXT NOT NULL DEFAULT 'customer',  -- customer | admin
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // --- Catalog (FS-0001) ---
  `CREATE TABLE IF NOT EXISTS category (
     id SERIAL PRIMARY KEY,
     code TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     parent_id INTEGER REFERENCES category(id)
   )`,
  `CREATE TABLE IF NOT EXISTS product (
     id SERIAL PRIMARY KEY,
     sku TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     description TEXT,
     price_cents INTEGER NOT NULL DEFAULT 0,   -- minor units (RULE-0007: server-authoritative)
     currency TEXT NOT NULL DEFAULT 'EUR',
     category_id INTEGER REFERENCES category(id),
     stock INTEGER NOT NULL DEFAULT 0,
     enabled BOOLEAN NOT NULL DEFAULT true,
     attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // --- Cart (FS-0002) ---
  `CREATE TABLE IF NOT EXISTS cart (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES app_user(id),
     session_key TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS cart_item (
     id SERIAL PRIMARY KEY,
     cart_id INTEGER NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
     product_id INTEGER NOT NULL REFERENCES product(id),
     quantity INTEGER NOT NULL CHECK (quantity > 0),
     options JSONB NOT NULL DEFAULT '{}'::jsonb
   )`,

  // --- Orders (FS-0003..0005) ---
  `CREATE TABLE IF NOT EXISTS orders (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES app_user(id),
     status TEXT NOT NULL DEFAULT 'CREATED',  -- CREATED|AWAITING_PAYMENT|PAID|FULFILLED|CANCELLED
     subtotal_cents INTEGER NOT NULL DEFAULT 0,
     tax_cents INTEGER NOT NULL DEFAULT 0,
     shipping_cents INTEGER NOT NULL DEFAULT 0,
     total_cents INTEGER NOT NULL DEFAULT 0,
     currency TEXT NOT NULL DEFAULT 'EUR',
     payment_ref TEXT,                         -- tokenized reference only (ADR-0006, no PAN)
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS order_item (
     id SERIAL PRIMARY KEY,
     order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     product_id INTEGER NOT NULL REFERENCES product(id),
     sku TEXT NOT NULL,
     name TEXT NOT NULL,
     unit_price_cents INTEGER NOT NULL,
     quantity INTEGER NOT NULL
   )`,

  // --- Agent (ShopiClaw) ---
  `CREATE TABLE IF NOT EXISTS agent_session (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES app_user(id),
     channel TEXT NOT NULL DEFAULT 'webchat',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS agent_message (
     id SERIAL PRIMARY KEY,
     session_id INTEGER REFERENCES agent_session(id) ON DELETE CASCADE,
     role TEXT NOT NULL,            -- user|assistant|tool
     content TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS agent_memory (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES app_user(id),
     content TEXT NOT NULL,
     pii BOOLEAN NOT NULL DEFAULT false,     -- tagged for GDPR lifecycle (DPR-0010)
     embedding vector(1536),
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS rag_document (
     id SERIAL PRIMARY KEY,
     collection TEXT NOT NULL DEFAULT 'catalog', -- catalog | twin_knowledge | policy
     ref TEXT,
     content TEXT NOT NULL,
     metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
     embedding vector(1536),
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // tool_audit: accountability for every tool/MCP call (RISK-0021)
  `CREATE TABLE IF NOT EXISTS tool_audit (
     id SERIAL PRIMARY KEY,
     ts TIMESTAMPTZ NOT NULL DEFAULT now(),
     actor TEXT,                  -- user id / mcp client id
     channel TEXT,                -- webchat | mcp
     tool TEXT NOT NULL,
     sensitivity TEXT,            -- read | write | guarded
     approved BOOLEAN,
     outcome TEXT,                -- ok | denied | error
     detail JSONB NOT NULL DEFAULT '{}'::jsonb
   )`,
  // ClawBands approvals (HITL) — pending guarded tool calls (RISK-0015)
  `CREATE TABLE IF NOT EXISTS tool_approval (
     id TEXT PRIMARY KEY,
     actor TEXT,
     tool TEXT NOT NULL,
     args JSONB NOT NULL DEFAULT '{}'::jsonb,
     decision TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     decided_at TIMESTAMPTZ
   )`,

  // --- Checkout/order fields (FS-0003/0004, RULE-0008..0014) ---
  // Customer context (RULE-0008) + shipping snapshot; payment_ref is a TOKENIZED
  // reference only (ADR-0006, RULE-0014) — never a PAN.
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_address JSONB NOT NULL DEFAULT '{}'::jsonb`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`,
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    for (const stmt of STATEMENTS) {
      await client.query(stmt);
    }
    console.log(`[migrations] applied ${STATEMENTS.length} statements`);
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
