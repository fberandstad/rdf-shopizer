# NFR Checklist — ShopiClaw

**Owner:** `tech-debt-manager`  **Stage:** 4  **Generated:** 2026-06-06
**Sources:** `03-target/security-baseline.md`, `compliance-matrix.md`, `target-architecture.md §8`.

> Verified per wave; W7 consolidates. Each item links to a control/RISK/DPR.

## Security

- [x] TLS-only + HSTS (RISK-0010, DPR-0001) — `middleware/security.js` (HSTS in prod)
- [x] Session cookies HttpOnly/Secure/SameSite; rotation/expiry (RISK-0013) — `auth.js`
- [x] RBAC + owner checks (RULE-0013/0016/0017; RISK-0012) — `middleware/rbac.js`, services
- [x] Zod validation at HTTP + tool boundaries (RISK-0011) — tool schemas + assert* validators
- [x] CSP + output encoding (XSS; RISK-0011) — `middleware/security.js` CSP
- [~] Secrets via Aquaman broker; CI secret scanning (RISK-0002, DPR-0004) — gateway secrets AES-256-GCM at rest (RULE-0018); gitleaks gate in CI; full broker = ops
- [x] Payment tokenization; no PAN anywhere (RISK-0001, DPR-0003) — W3 `payments.js`
- [x] Rate limiting (HTTP + per-tool + MCP) (RISK-0020/0022) — `index.js` limiters
- [~] Dependency SCA + SBOM (RISK-0019) — `npm audit` gate in CI; SBOM = release step

## Agent / LLM

- [x] Prompt-injection: instruction/data separation, RAG allow-list (RISK-0014) — `agent/AGENTS.md`, gateway
- [x] ClawBands HITL on guarded/money-path tools (RISK-0015) — `agent/clawbands.js`
- [x] Aquaman: no secrets/PII in prompts (RISK-0016, DPR-0009) — `agent/aquaman.js` (`useCredential`/`redact`)
- [x] RAG grounding; server-authoritative pricing (RISK-0017; RULE-0007) — `cart.js`/`orders.js`, RAG retriever
- [x] Tool-call audit (`tool_audit`) incl. MCP client id (RISK-0021) — `agent/clawbands.js`
- [x] Iteration cap (12) + per-session serialization — agent gateway
- [x] MCP: guarded tools not exposed by default; per-client allow-list (RISK-0022/0023) — `agent/mcp.js`
- [x] Analytics: named allow-listed queries only; role-scoped (RISK-0024) — `routes/metricsQueries.js`

## Compliance (GDPR/PCI/AI)

- [x] Consent capture for marketing (DPR-0008) — `content.subscribe`/`withdrawConsent`
- [x] Data-subject access/erasure incl. vector memory + RAG (DPR-0005/0006) — `gdpr.js` (cascades `agent_memory`)
- [x] Retention schedule + purge jobs (DPR-0011) — `retention.js`, admin/heartbeat trigger
- [x] AI transparency + human escalation (DPR-0012/0013) — `/api/ai-disclosure`, ClawBands HITL
- [x] DPIA for agent (DPR-0015); OpenAI DPA/region (DPR-0017); RoPA (DPR-0018) — `docs/compliance/`
- [x] PCI SAQ-A posture (tokenization) — no PAN; tokenized refs only

## Performance / scalability

- [ ] Stateless API + Redis sessions (DEBT-0019)
- [ ] Containerized; horizontal scale; per-session locks for agent
- [ ] Embedding cache; model tiering; heartbeat deterministic-first (cost)

## Observability

- [ ] pino structured logs (no secrets/PII)
- [ ] OpenTelemetry traces/metrics
- [ ] `/health` + `/ready` (getSystemHealth) ; agent-trace audit

## Quality

- [x] Golden-master E2E (TEST-0001..0028) green on target — 39/39 Playwright
- [x] Unit + integration coverage gate — 47/47 unit (`npm test`)
- [x] Lint/format CI; conventional commits; PR review — `.github/workflows/ci.yml` (gated, no auto-deploy)
