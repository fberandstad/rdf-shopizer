# NFR Checklist — ShopiClaw

**Owner:** `tech-debt-manager`  **Stage:** 4  **Generated:** 2026-06-06
**Sources:** `03-target/security-baseline.md`, `compliance-matrix.md`, `target-architecture.md §8`.

> Verified per wave; W7 consolidates. Each item links to a control/RISK/DPR.

## Security

- [ ] TLS-only + HSTS (RISK-0010, DPR-0001)
- [ ] Session cookies HttpOnly/Secure/SameSite; rotation/expiry (RISK-0013)
- [ ] RBAC + owner checks (RULE-0013/0016/0017; RISK-0012)
- [ ] Zod validation at HTTP + tool boundaries (RISK-0011)
- [ ] CSP + output encoding (XSS; RISK-0011)
- [ ] Secrets via Aquaman broker; CI secret scanning (RISK-0002, DPR-0004)
- [ ] Payment tokenization; no PAN anywhere (RISK-0001, DPR-0003)
- [ ] Rate limiting (HTTP + per-tool + MCP) (RISK-0020/0022)
- [ ] Dependency SCA + SBOM (RISK-0019)

## Agent / LLM

- [ ] Prompt-injection: instruction/data separation, RAG allow-list (RISK-0014)
- [ ] ClawBands HITL on guarded/money-path tools (RISK-0015)
- [ ] Aquaman: no secrets/PII in prompts (RISK-0016, DPR-0009)
- [ ] RAG grounding; server-authoritative pricing (RISK-0017; RULE-0007)
- [ ] Tool-call audit (`tool_audit`) incl. MCP client id (RISK-0021)
- [ ] Iteration cap (12) + per-session serialization
- [ ] MCP: guarded tools not exposed by default; per-client allow-list (RISK-0022/0023)
- [ ] Analytics: named allow-listed queries only; role-scoped (RISK-0024)

## Compliance (GDPR/PCI/AI)

- [ ] Consent capture for marketing (DPR-0008)
- [ ] Data-subject access/erasure incl. vector memory + RAG (DPR-0005/0006)
- [ ] Retention schedule + purge jobs (DPR-0011)
- [ ] AI transparency + human escalation (DPR-0012/0013)
- [ ] DPIA for agent (DPR-0015); OpenAI DPA/region (DPR-0017); RoPA (DPR-0018)
- [ ] PCI SAQ-A posture (tokenization)

## Performance / scalability

- [ ] Stateless API + Redis sessions (DEBT-0019)
- [ ] Containerized; horizontal scale; per-session locks for agent
- [ ] Embedding cache; model tiering; heartbeat deterministic-first (cost)

## Observability

- [ ] pino structured logs (no secrets/PII)
- [ ] OpenTelemetry traces/metrics
- [ ] `/health` + `/ready` (getSystemHealth) ; agent-trace audit

## Quality

- [ ] Golden-master E2E (TEST-0001..0028) green on target
- [ ] Unit + integration coverage gate
- [ ] Lint/format CI; conventional commits; PR review
