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
const { securityHeaders } = require('./middleware/security');
const { createCopilotHandler } = require('./agent/gateway');
const mcp = require('./agent/mcp');
const heartbeat = require('./agent/heartbeat');

const catalogRoutes = require('./routes/catalog');
const opsRoutes = require('./routes/ops');
const knowledgeRoutes = require('./routes/knowledge');
const agentRoutes = require('./routes/agent');
const ragRoutes = require('./routes/rag');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const accountRoutes = require('./routes/account');
const newsletterRoutes = require('./routes/newsletter');
const fileRoutes = require('./routes/files');
const adminRoutes = require('./routes/admin');
const interopRoutes = require('./routes/interop');

const app = express();

app.disable('x-powered-by');
app.use(securityHeaders);                 // CSP/HSTS/anti-clickjacking (RISK-0010/0011, DPR-0001)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// --- Session & auth ---
const { sessionMiddleware, authRouter } = setupAuth(pool);
app.use(sessionMiddleware);
app.use((req, res, next) => { if (req.session?.user) req.user = req.session.user; next(); });
// Strict per-IP limiter on auth to blunt credential stuffing / brute force (RISK-0020).
// Strict in production; lenient in dev/test/CI so suites that register many users don't trip it.
const authMax = config.nodeEnv === 'production' ? 20 : 2000;
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: authMax, standardHeaders: true, legacyHeaders: false });
app.use('/auth', authLimiter, authRouter);

// --- Public ops (no auth) ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/copilotkit-health', (req, res) => res.json({ ok: !!config.openai.apiKey }));
// AI transparency disclosure (DPR-0012): users are told they interact with an AI agent
// and how to reach a human. Public so the client can show it pre-auth.
app.get('/api/ai-disclosure', (req, res) => res.json({
  agent: 'ShopiClaw',
  aiPowered: true,
  notice: 'You are chatting with ShopiClaw, an AI shopping assistant. Responses may be ' +
    'automated. Consequential actions (payments, refunds, admin changes) require human ' +
    'approval (ClawBands). For human help, contact support or ask to escalate.',
  humanEscalation: 'mailto:support@randstad.fr',
  rights: { access: 'GET /api/account/export', erasure: 'DELETE /api/account', withdrawConsent: 'POST /api/newsletter/withdraw' },
}));

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
      req.path === '/ops/health' || req.path === '/ops/ready' ||
      req.path === '/ai-disclosure' ||
      req.path.startsWith('/interop')) {   // interop has its own per-client bearer auth (FS-0015)
    return next();
  }
  return requireAuth(req, res, next);
});

// --- API routes ---
app.use('/api/catalog', catalogRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/interop', interopRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
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
