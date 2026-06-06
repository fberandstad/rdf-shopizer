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
  agent: {
    maxToolIterations: parseInt(process.env.AGENT_MAX_TOOL_ITERATIONS || '12', 10),
    guardedTools: (process.env.CLAWBANDS_GUARDED_TOOLS ||
      'payOrder,requestRefund,manageCatalog,manageInventory').split(',').map(s => s.trim()),
  },
  heartbeat: {
    enabled: String(process.env.HEARTBEAT_ENABLED).toLowerCase() === 'true',
    cron: process.env.HEARTBEAT_CRON || '*/30 * * * *',
  },
  mcp: {
    enabled: String(process.env.MCP_ENABLED).toLowerCase() !== 'false',
    clientTokens: safeJson(process.env.MCP_CLIENT_TOKENS, {}),
  },
  psp: {
    provider: process.env.PSP_PROVIDER || 'mock',
    apiKey: process.env.PSP_API_KEY || '',
  },
};

function safeJson(s, fallback) {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
