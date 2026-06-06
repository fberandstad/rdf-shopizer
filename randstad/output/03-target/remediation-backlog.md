# Remediation Backlog — ShopiClaw

**Owner:** `security-analyst`  **Stage:** 3  **Generated:** 2026-06-06
**Schema:** `RISK-#### | detection/threat | OWASP/CWE | severity | control | status`

> Reconciles **all 46** scan-report detections + threat-model findings. Status:
> `controlled` (design control defined), `accepted` (residual, justified), `open`
> (needs Stage 4 implementation). Money-path items are never silently accepted.

## Scan-report detections (Aggregate Scan Summary)

| RISK | Detection | OWASP/CWE | Sev | Control | Status |
|------|-----------|-----------|-----|---------|--------|
| RISK-0001 | FINANCIAL: card data in `CreditCardUtil`(14), `BeanStream`(2), `Paypal`(1) | PCI; CWE-311/312 | Critical | Tokenization/hosted fields; remove card storage & `CreditCardUtil`/`EncryptionUtil` (ADR-0006) | controlled→open(Stage4) |
| RISK-0002 | CREDENTIALS: keys in `BeanStream`, `Paypal`, `EncryptionUtil`, `FacebookIntegrationFactory`, `SimpleCaptcha` | A05; CWE-798 | Critical | Aquaman broker + secret manager; CI secret scan; never in code/prompts | controlled→open |
| RISK-0003 | PII: `Customer`/order data, `SubscriptionAction`(2), `CatalogConstants`(1) | GDPR; CWE-359 | High | PII minimization, encryption at rest, access control, erasure | controlled→open |
| RISK-0004 | PII in JS libs `jquery.meiomask.js`, `cookie.js`, `jquery-cookie.js`, `ckeditor.js`, `Jcrop.js` | — | Low | Likely false-positives in 3rd-party JS; libs **replaced** by React stack | controlled (replaced) |
| RISK-0005 | PII in admin screenshots `admin003/004/006/007.png` | GDPR | Low | Docs-only; exclude from app & index (redaction-log R13) | accepted (doc) |
| RISK-0006 | PII in `groovy-all-1.5.5-LICENSE.txt` | — | Info | False-positive (names in license); Groovy removed | accepted |
| RISK-0007 | `test_sensitive_data.txt` detection | — | Med | Test fixture — **delete**; not migrated | open (delete) |
| RISK-0008 | `README.md` detection (1) | — | Info | Review/scrub; doc only | accepted |

## Threat-model findings

| RISK | Threat | OWASP/CWE | Sev | Control | Status |
|------|--------|-----------|-----|---------|--------|
| RISK-0010 | HTTPS disabled in legacy (DEBT-0014) | A02/A05 | High | TLS-only + HSTS by default | controlled→open |
| RISK-0011 | XSS across UI/API (CAST: CWE-79 dominant) | A03; CWE-79 | High | Output encoding + CSP; React escaping; Zod | controlled→open |
| RISK-0012 | IDOR on orders/invoices | A01; CWE-639 | High | Owner check RULE-0013; authz tests | controlled→open |
| RISK-0013 | Custom auth weaknesses (DEBT-0015) | A07 | High | Session middleware + RBAC; rotation/expiry | controlled→open |
| RISK-0014 | Prompt injection (LLM01) | LLM01 | High | instruction/data separation; RAG allow-list; tool deny from untrusted | controlled→open |
| RISK-0015 | Excessive agency on money-path (LLM08) | LLM08 | High | ClawBands HITL for payOrder/refund/admin | controlled→open |
| RISK-0016 | Sensitive info disclosure via agent (LLM06) | LLM06 | High | Aquaman; tool authz; PII minimization | controlled→open |
| RISK-0017 | Hallucinated commerce facts (LLM09) | LLM09 | Med | RAG grounding; deterministic services | controlled→open |
| RISK-0018 | Memory poisoning | LLM (mem) | Med | curated/tagged memory; erasure; review | open |
| RISK-0019 | Vulnerable deps (legacy + new) | A06 | High | SCA/SBOM/Dependabot; recover legacy JAR versions (V1-V3) | open |
| RISK-0020 | Agent endpoint abuse/cost/DoS | A04; LLM10 | Med | auth, rate limits, iteration cap, model tiering | controlled→open |
| RISK-0021 | Repudiation of agent actions | — | Med | signed tool_audit trail | controlled→open |
| RISK-0022 | MCP server over-exposure to external agents (ADR-0013) | A01/LLM07/LLM08 | High | guarded tools not exposed by default; per-client bearer + allow-list + rate limit; audit | controlled→open |
| RISK-0023 | MCP twin/knowledge resource leaks PII/secrets | LLM06; GDPR | Med | redaction at ingest (DPR-0009); non-PII corpus; resource allow-list | controlled→open |
| RISK-0024 | Analytics query injection / KPI over-exposure (ADR-0012) | A03; CWE-89 | Med | named allow-listed queries (no free-form SQL); role-scoped metrics | controlled→open |

## Coverage

- **Scan detections mapped:** 46/46 (RISK-0001..0008 cover all categories/files). **0 unmapped.**
- **Money-path:** RISK-0001/0010/0012/0015 — none accepted without control or HITL.
- **Accepted residuals:** RISK-0005/0006/0008 (docs/false-positives) only.
- Stage 4 implements `open` items; each links to a `guarded`-tool approval test and golden-master.
