// ShopiClaw tool registry. Each tool: { name, description, sensitivity, parameters(zod), handler }.
// Handlers enforce business rules server-side; the LLM cannot bypass them (ADR-0005).
// W0 ships the read/safe tools + guarded stubs; later waves flesh out commerce handlers.
const { z } = require('zod');
const { pool } = require('./../../db');
const { search } = require('./../../rag/retriever');
const metrics = require('./../../routes/metricsQueries');

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
    description: 'Get a single product by SKU.',
    sensitivity: 'read',
    parameters: z.object({ sku: z.string() }),
    handler: async ({ sku }) => {
      const { rows } = await pool.query('SELECT * FROM product WHERE sku=$1 AND enabled=true', [sku]);
      if (!rows[0]) throw new Error('product not found');
      return rows[0];
    },
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
];

const byName = Object.fromEntries(tools.map(t => [t.name, t]));

// Tools safe to expose over MCP by default (read-only, no money-path).
const MCP_SAFE = ['searchCatalog', 'getProduct', 'ragSearch', 'twinKnowledgeSearch',
  'getSystemHealth', 'getBusinessMetrics'];

module.exports = { tools, byName, MCP_SAFE };
