// Server-side configuration constants (sourced from env). No secrets are logged.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientDist: process.env.CLIENT_DIST || require('path').join(__dirname, '..', 'client', 'dist'),
  pg: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '15432', 10),
    database: process.env.PG_DATABASE || 'shopiclaw',
    user: process.env.PG_USER || 'shopiclaw',
    password: process.env.PG_PASSWORD || 'shopiclaw',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
  },
  auth: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me-please-32x',
    ttlHours: parseInt(process.env.SESSION_TTL_HOURS || '8', 10),
    defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@randstad.fr',
    defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  },
  secrets: {
    // Key for encrypting merchant gateway credentials at rest (RULE-0018). Set in prod.
    configKey: process.env.CONFIG_ENC_KEY || process.env.SESSION_SECRET || 'dev-insecure-config-enc-key-change-me',
  },
  agent: {
    maxToolIterations: parseInt(process.env.AGENT_MAX_TOOL_ITERATIONS || '12', 10),
    guardedTools: (process.env.CLAWBANDS_GUARDED_TOOLS ||
      'payOrder,requestRefund,manageCatalog,manageInventory').split(',').map(s => s.trim()),
  },
  heartbeat: {
    enabled: String(process.env.HEARTBEAT_ENABLED).toLowerCase() === 'true',
    cron: process.env.HEARTBEAT_CRON || '*/30 * * * *',
    lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '5', 10),
    abandonedCartHours: parseInt(process.env.ABANDONED_CART_HOURS || '24', 10),
  },
  mcp: {
    enabled: String(process.env.MCP_ENABLED).toLowerCase() !== 'false',
    clientTokens: safeJson(process.env.MCP_CLIENT_TOKENS, {}),
  },
  interop: {
    // SOAP→REST facade (FS-0015, ADR-0009). External B2B systems authenticate with a bearer
    // token (replacing JAX-WS endpoints). Read-only, PII-minimized. Falls back to MCP tokens.
    enabled: String(process.env.INTEROP_ENABLED).toLowerCase() !== 'false',
    clientTokens: safeJson(process.env.INTEROP_CLIENT_TOKENS, null) || safeJson(process.env.MCP_CLIENT_TOKENS, {}),
  },
  retention: {
    // GDPR data-retention schedule (DPR-0011). Auto-purge windows in days.
    agentMessageDays: parseInt(process.env.RETENTION_AGENT_MESSAGE_DAYS || '90', 10),
    toolAuditDays: parseInt(process.env.RETENTION_TOOL_AUDIT_DAYS || '365', 10),
    notificationDays: parseInt(process.env.RETENTION_NOTIFICATION_DAYS || '180', 10),
  },
  psp: {
    provider: process.env.PSP_PROVIDER || 'mock',
    apiKey: process.env.PSP_API_KEY || '',
  },
  rag: {
    // Root of the Digital Twin corpus (00-twin / 02-reverse / 03-target).
    twinRoot: process.env.TWIN_ROOT || require('path').resolve(__dirname, '..', '..', '..', '..'),
  },
  cart: {
    // Server-authoritative pricing inputs (RULE-0007). Tax in basis points (e.g. 2000 = 20%).
    // Full geo-zone tax (RULE-0019) is deferred to the checkout wave.
    taxRateBps: parseInt(process.env.TAX_RATE_BPS || '0', 10),
    flatShippingCents: parseInt(process.env.SHIPPING_FLAT_CENTS || '0', 10),
  },
};

function safeJson(s, fallback) {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
