// ShopiClaw tool registry. Each tool: { name, description, sensitivity, parameters(zod), handler }.
// Handlers enforce business rules server-side; the LLM cannot bypass them (ADR-0005).
// W0 ships the read/safe tools + guarded stubs; later waves flesh out commerce handlers.
const { z } = require('zod');
const { pool } = require('./../../db');
const { search } = require('./../../rag/retriever');
const metrics = require('./../../routes/metricsQueries');
const cart = require('./../../cart');
const orders = require('./../../orders');
const content = require('./../../content');
const admin = require('./../../admin');

const tools = [
  {
    name: 'searchCatalog',
    description: 'Search products by keyword and/or category. Returns enabled products only.',
    sensitivity: 'read',
    parameters: z.object({ q: z.string().optional(), categoryCode: z.string().optional() }),
    handler: async ({ q, categoryCode }) => {
      const params = [];
      let where = 'p.enabled = true';
      if (q) { params.push(`%${q}%`); where += ` AND p.name ILIKE $${params.length}`; }
      if (categoryCode) { params.push(categoryCode); where += ` AND c.code = $${params.length}`; }
      const { rows } = await pool.query(
        `SELECT p.id, p.sku, p.name, p.price_cents, p.currency, p.stock
         FROM product p LEFT JOIN category c ON c.id = p.category_id
         WHERE ${where} ORDER BY p.name LIMIT 25`, params);
      return rows;
    },
  },
  {
    name: 'getProduct',
    description: 'Get a single product by SKU (name, price, attributes, stock).',
    sensitivity: 'read',
    parameters: z.object({ sku: z.string() }),
    handler: async ({ sku }) => {
      const { rows } = await pool.query(
        `SELECT p.*, c.code AS category_code, c.name AS category_name
         FROM product p LEFT JOIN category c ON c.id = p.category_id
         WHERE p.sku=$1 AND p.enabled=true`, [sku]);
      if (!rows[0]) throw new Error('product not found');
      return rows[0];
    },
  },
  {
    name: 'listCategories',
    description: 'List catalog categories (code, name, parent) for browsing/filtering.',
    sensitivity: 'read',
    parameters: z.object({}),
    handler: async () => {
      const { rows } = await pool.query(
        `SELECT c.id, c.code, c.name, c.parent_id,
                (SELECT count(*) FROM product p WHERE p.category_id = c.id AND p.enabled=true)::int AS product_count
         FROM category c ORDER BY c.name`);
      return rows;
    },
  },
  {
    name: 'getCart',
    description: 'Get the current shopping cart with server-computed totals (FS-0002).',
    sensitivity: 'read',
    parameters: z.object({}),
    handler: async (_args, ctx) => cart.getCart(cart.ownerFromCtx(ctx)),
  },
  {
    name: 'addToCart',
    description: 'Add a product (by SKU) to the cart. Enforces stock, required options, ' +
      'positive quantity, and line merge; totals are recomputed server-side (RULE-0001..0007).',
    sensitivity: 'write',
    parameters: z.object({
      sku: z.string(),
      quantity: z.number().int().positive().default(1),
      options: z.record(z.any()).optional(),
    }),
    handler: async ({ sku, quantity = 1, options = {} }, ctx) =>
      cart.addItem(cart.ownerFromCtx(ctx), { sku, quantity, options }),
  },
  {
    name: 'updateCart',
    description: 'Update a cart line quantity (0 removes it). Totals recomputed server-side (RULE-0007).',
    sensitivity: 'write',
    parameters: z.object({ itemId: z.number().int().positive(), quantity: z.number().int().min(0) }),
    handler: async ({ itemId, quantity }, ctx) =>
      cart.updateItem(cart.ownerFromCtx(ctx), { itemId, quantity }),
  },
  {
    name: 'calculateShipping',
    description: 'List the available shipping methods and their server-authoritative costs (TEST-0010).',
    sensitivity: 'read',
    parameters: z.object({}),
    handler: async () => ({ options: cart.shippingOptions(), currency: 'EUR' }),
  },
  {
    name: 'createOrder',
    description: 'Create an order from the current cart (requires customer context). Totals are ' +
      'server-authoritative; the order awaits payment (RULE-0008/0012).',
    sensitivity: 'write',
    parameters: z.object({
      customer: z.object({ name: z.string(), email: z.string().email() }),
      shipAddress: z.record(z.any()).optional(),
      shippingMethod: z.string().optional(),
    }),
    handler: async ({ customer, shipAddress = {}, shippingMethod }, ctx) =>
      orders.createOrder(cart.ownerFromCtx(ctx), { customer, shipAddress, shippingMethod }),
  },
  {
    name: 'payOrder',
    description: 'Pay an order with a tokenized payment (NEVER a card number). Guarded: requires ' +
      'human approval (ClawBands). On failure no order is persisted (RULE-0009..0012).',
    sensitivity: 'guarded',
    parameters: z.object({
      orderId: z.number().int().positive(),
      paymentToken: z.string(),
      mode: z.enum(['authorize', 'capture', 'authorizeAndCapture']).optional(),
    }),
    handler: async ({ orderId, paymentToken, mode }, ctx) =>
      orders.payOrder(cart.ownerFromCtx(ctx), { orderId, paymentToken, mode }),
  },
  {
    name: 'getOrderStatus',
    description: 'Get one of the current user\'s orders by id (owner-scoped; payment masked).',
    sensitivity: 'read',
    parameters: z.object({ orderId: z.number().int().positive() }),
    handler: async ({ orderId }, ctx) => orders.getOrder(cart.ownerFromCtx(ctx), orderId),
  },
  {
    name: 'listMyOrders',
    description: 'List the current user\'s orders (owner-scoped).',
    sensitivity: 'read',
    parameters: z.object({}),
    handler: async (_args, ctx) => orders.listOrders(cart.ownerFromCtx(ctx)),
  },
  {
    name: 'listProductReviews',
    description: 'List reviews (rating, title, body, author) and average rating for a product SKU.',
    sensitivity: 'read',
    parameters: z.object({ sku: z.string() }),
    handler: async ({ sku }) => content.listReviews(sku),
  },
  {
    name: 'submitReview',
    description: 'Post or update the current user\'s review for a product (rating 1-5). Tied to user+product.',
    sensitivity: 'write',
    parameters: z.object({
      sku: z.string(), rating: z.number().int().min(1).max(5),
      title: z.string().optional(), body: z.string().optional(),
    }),
    handler: async ({ sku, rating, title, body }, ctx) =>
      content.submitReview(cart.ownerFromCtx(ctx).userId, sku, { rating, title, body }),
  },
  {
    name: 'subscribeNewsletter',
    description: 'Subscribe an email to the newsletter with explicit consent (PII; FS-0007).',
    sensitivity: 'write',
    parameters: z.object({ email: z.string().email(), consent: z.boolean().optional() }),
    handler: async ({ email, consent }) => content.subscribe(email, consent !== false),
  },
  {
    name: 'ragSearch',
    description: 'Semantic search over the product/policy knowledge base.',
    sensitivity: 'read',
    parameters: z.object({ query: z.string(), collection: z.enum(['catalog', 'policy']).optional() }),
    handler: async ({ query, collection = 'catalog' }) => search(query, { collection }),
  },
  {
    name: 'twinKnowledgeSearch',
    description: 'Answer questions about ShopiClaw itself (architecture, business rules, ADRs, ' +
      'legacy behavior) grounded in the Digital Twin, with traceability citations.',
    sensitivity: 'read',
    parameters: z.object({ question: z.string() }),
    handler: async ({ question }) => {
      const hits = await search(question, { collection: 'twin_knowledge', limit: 6 });
      return {
        passages: hits.map(h => ({ content: h.content, source: h.metadata?.source || h.ref })),
        citations: [...new Set(hits.map(h => h.metadata?.source || h.ref).filter(Boolean))],
      };
    },
  },
  {
    name: 'getSystemHealth',
    description: 'Report ShopiClaw health: database, OpenAI config, heartbeat, version.',
    sensitivity: 'read',
    parameters: z.object({}),
    handler: async () => metrics.systemHealth(),
  },
  {
    name: 'getBusinessMetrics',
    description: 'Functional analytics via named, allow-listed queries (orders processed, revenue, ' +
      'AOV, abandonment, low stock, new customers). Role-scoped; no free-form SQL.',
    sensitivity: 'read',
    parameters: z.object({
      metric: z.enum(['orders_count', 'revenue', 'aov', 'cart_abandonment',
        'top_products', 'low_stock_count', 'new_customers']),
      period: z.enum(['today', 'week', 'month', 'ytd']).optional(),
    }),
    handler: async ({ metric, period = 'today' }, ctx) => metrics.businessMetric(metric, period, ctx),
  },
  {
    name: 'manageCatalog',
    description: 'Create or update a product (admin). Guarded: requires human approval (ClawBands).',
    sensitivity: 'guarded',
    parameters: z.object({
      action: z.enum(['create', 'update']),
      sku: z.string(),
      name: z.string().optional(),
      priceCents: z.number().int().min(0).optional(),
      description: z.string().optional(),
      categoryCode: z.string().optional(),
      stock: z.number().int().min(0).optional(),
      enabled: z.boolean().optional(),
    }),
    handler: async ({ action, sku, ...rest }, ctx) => {
      if (ctx.role && ctx.role !== 'admin') { const e = new Error('admin role required'); e.code = 'FORBIDDEN'; throw e; }
      return action === 'create' ? admin.createProduct({ sku, ...rest }) : admin.updateProduct(sku, rest);
    },
  },
  {
    name: 'manageInventory',
    description: 'Adjust product stock by a signed delta (admin). Guarded: requires human approval.',
    sensitivity: 'guarded',
    parameters: z.object({ sku: z.string(), delta: z.number().int() }),
    handler: async ({ sku, delta }, ctx) => {
      if (ctx.role && ctx.role !== 'admin') { const e = new Error('admin role required'); e.code = 'FORBIDDEN'; throw e; }
      return admin.adjustStock(sku, delta);
    },
  },
];

const byName = Object.fromEntries(tools.map(t => [t.name, t]));

// Tools safe to expose over MCP by default (read-only, no money-path).
// Owner-scoped order reads stay OFF MCP (they depend on a user session, not an MCP client).
const MCP_SAFE = ['searchCatalog', 'getProduct', 'listCategories', 'calculateShipping',
  'listProductReviews', 'ragSearch', 'twinKnowledgeSearch', 'getSystemHealth', 'getBusinessMetrics'];

module.exports = { tools, byName, MCP_SAFE };
