# Security Baseline — ShopiClaw

**Owner:** `security-analyst`  **Stage:** 3  **Generated:** 2026-06-06  **Gate:** stage-3-approval
**Inputs:** `02-reverse/**`, `docs/📊 Aggregate Scan Summary Report.md`, target architecture.
**Frameworks:** OWASP ASVS L2, OWASP Top-10 (2021), **OWASP Top-10 for LLM Apps**, CWE, PCI-DSS.

> Every detection in the Aggregate Scan Summary (46) is reconciled to a **control** or an
> **accepted RISK-####** (see `remediation-backlog.md`). ShopiClaw introduces an agent, so
> the baseline adds LLM/agent controls absent from the legacy app.

## 1. Scan-report reconciliation (46 detections)

| Category | Count | Disposition in ShopiClaw |
|----------|-------|--------------------------|
| FINANCIAL (16) | card data in `CreditCardUtil`, `BeanStream`, `Paypal` | **Eliminated** via tokenization/hosted fields (ADR-0006); no PAN in app/agent/DB → RISK-0001 controlled |
| CREDENTIALS (4) | keys in `BeanStream`, `Paypal`, `EncryptionUtil`, `FacebookIntegrationFactory`, `SimpleCaptcha` | **Secret broker (Aquaman)** + secret scanning in CI; no secrets in code/prompts → RISK-0002 controlled |
| PII (26) | customer data, JS libs, admin screenshots, test fixture | Data-protection controls (GDPR), PII minimization in prompts/memory; remove `test_sensitive_data.txt`; FP in license/JS noted → RISK-0003 controlled |

Detailed per-file mapping in `remediation-backlog.md` (RISK-0001..). All 46 mapped; **0 unmapped**.

## 2. Control baseline (target)

| Domain | Control | ASVS/OWASP |
|--------|---------|-----------|
| AuthN | Session cookies (HttpOnly, Secure, SameSite), optional OIDC SSO, password hashing (argon2/bcrypt) | ASVS V2/V3 |
| AuthZ | RBAC (roles/permissions), owner checks (RULE-0013), admin-gated tools (RULE-0016/0017) | ASVS V4; A01 |
| Transport | **TLS-only/HSTS** (resolves legacy DEBT-0014: HTTPS was disabled) | A05 |
| Input validation | Zod at every boundary (HTTP + tool inputs) | A03; CWE-20 |
| Output | Context-encoding + **CSP**, anti-XSS (CAST top finding) | A03; CWE-79 |
| CSRF | SameSite + CSRF tokens on state-changing routes | A01 |
| Secrets | Aquaman broker + env/secret manager; CI secret scanning | A05; CWE-798 |
| Payments | Tokenization → PCI SAQ-A; no PAN storage | PCI-DSS |
| Dependencies | npm SCA + SBOM + Dependabot | A06 |
| Logging | Structured audit incl. **agent tool-call trace**; no secrets/PII in logs | A09 |
| Sessions | Redis-backed, expiry/rotation, idle timeout | ASVS V3 |
| Rate limiting | Per-IP/session + per-tool (agent) | A04 |

## 3. LLM / agent controls (new)

| LLM Top-10 | Risk | Control |
|------------|------|---------|
| LLM01 Prompt injection | malicious content steers agent | instruction/`data` separation; RAG source allow-list; untrusted-content tagging; tool deny from untrusted text |
| LLM02 Insecure output handling | agent output drives unsafe action | Zod-validate tool args; deterministic services; output encoding in UI |
| LLM06 Sensitive info disclosure | secrets/PII leak via prompt | Aquaman (no keys in context); PII minimization/redaction; memory hygiene |
| LLM07 Insecure plugin/tool design | over-permissive tools | typed tools, sensitivity tiers, per-role allow-lists |
| LLM08 Excessive agency | agent does too much on money-path | **ClawBands** policy + HITL approval for guarded tools; max 12 iters; per-session serialize |
| LLM09 Overreliance | hallucinated commerce facts | RAG grounding; server-authoritative pricing (RULE-0007); no LLM-only decisions |
| LLM10 Model theft/abuse | cost/abuse | rate limits, model tiering, auth on agent endpoints |
| Memory poisoning | tainted long-term memory | curated/tagged memory writes; review of MEMORY.md; erasure support |

## 4. Secure SDLC

- CI gates: SAST, SCA, secret-scan, coverage, golden-master E2E.
- Threat model maintained (`threat-model.md`); pen-test before go-live.
- All `guarded` tools require an approval/authorization test.

## 5. Residual risk

Accepted risks tracked as RISK-#### in `remediation-backlog.md`; none on the money-path are
auto-accepted (all require control or HITL). PCI/GDPR specifics in `compliance-matrix.md`.
