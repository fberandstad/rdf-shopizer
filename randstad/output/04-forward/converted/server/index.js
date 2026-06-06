// ShopiClaw API server — Wave 0 bootstrap.
// Express + session auth + RBAC + Postgres/pgvector + ShopiClaw agent (CopilotKit/OpenAI)
// + MCP server + Heartbeat. Mirrors the example/ cockpit server conventions.
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { pool } = require('./db');
const { runMigrations } = require('./migrations');
const { setupAuth, ensureDefaultAdmin } = require('./auth');
const { requireAuth } = require('./middleware/rbac');
const { createCopilotHandler } = require('./agent/gateway');
const mcp = require('./agent/mcp');
const heartbeat = require('./agent/heartbeat');

const catalogRoutes = require('./routes/catalog');
const opsRoutes = require('./routes/ops');
const knowledgeRoutes = require('./routes/knowledge');
const agentRoutes = require('./routes/agent');
const ragRoutes = require('./routes/rag');
const cartRoutes = require('./routes/cart');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// --- Session & auth ---
const { sessionMiddleware, authRouter } = setupAuth(pool);
app.use(sessionMiddleware);
app.use((req, res, next) => { if (req.session?.user) req.user = req.session.user; next(); });
app.use('/auth', authRouter);

// --- Public ops (no auth) ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/copilotkit-health', (req, res) => res.json({ ok: !!config.openai.apiKey }));

// --- MCP server (own per-client bearer auth; not session-gated) ---
const mcpLimiter = rateLimit({ windowMs: 60_000, max: 60 });
app.post('/mcp', mcpLimiter, express.json(), (req, res) => mcp.handle(req, res));

// --- CopilotKit agent runtime (session user injected for ClawBands ctx) ---
app.use('/api/copilotkit', createCopilotHandler());

// --- Auth gate for the rest of /api ---
const apiLimiter = rateLimit({ windowMs: 60_000, max: 300 });
app.use('/api', apiLimiter, (req, res, next) => {
  if (req.path === '/health' || req.path === '/copilotkit-health' ||
      req.path.startsWith('/copilotkit') ||
      req.path === '/ops/health' || req.path === '/ops/ready') {
    return next();
  }
  return requireAuth(req, res, next);
});

// --- API routes ---
app.use('/api/catalog', catalogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/ops', opsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/rag', ragRoutes);

// --- Static client (production) ---
app.use(express.static(config.clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/mcp') return next();
  res.sendFile(path.join(config.clientDist, 'index.html'), (err) => err && next());
});

// --- Centralized error handler (no secrets/PII leaked) ---
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: 'internal error' });
});

async function start() {
  await runMigrations();
  await ensureDefaultAdmin();
  if (config.heartbeat.enabled) heartbeat.start(config.heartbeat.cron);
  app.listen(config.port, () => {
    console.log(`[shopiclaw] listening on :${config.port} (env=${config.nodeEnv})`);
    if (!config.openai.apiKey) console.warn('[shopiclaw] OPENAI_API_KEY not set — agent/RAG run in degraded mode');
  });
}

start().catch((e) => { console.error('startup failed:', e); process.exit(1); });

module.exports = { app };
