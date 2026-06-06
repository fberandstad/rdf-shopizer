# Redaction Log — Stage 1

**Owner:** `pii-redaction-filter`  **Stage:** 1  **Generated:** 2026-06-06
**Policy:** `rules/data-redaction.md` — nothing reaches the Twin index or an external
tool un-redacted. Categories: **PII**, **FINANCIAL**, **CREDENTIALS**.
**Baseline source:** `docs/📊 Aggregate Scan Summary Report.md` (2025-12-10).

## 1. Scan baseline (reconciled)

| Metric | Value |
|--------|-------|
| Files scanned | 1,282 |
| Total detections | 46 |
| Files with detections | 23 |
| Confidence | High 37 · Medium 9 · Low 0 |
| By category | PII 26 · FINANCIAL 16 · CREDENTIALS 4 |
| Scanners | Presidio 42 · LLMGuard 4 |

## 2. Stage 1 redaction actions

No raw artifact contents from the hotspots below were embedded into the Twin graph.
Where Stage 1 artifacts reference these files, only **file paths and structural
metadata** were indexed — never secret/PII values.

| # | Source (known hotspot) | Category | Action | Indexed? |
|---|------------------------|----------|--------|----------|
| R1 | `sm-core/.../util/CreditCardUtil.java` (14) | FINANCIAL | path/metadata only; values withheld | metadata-only |
| R2 | `sm-core/.../integration/payment/BeanStreamTransactionImpl.java` (2) | CREDENTIALS/FINANCIAL | path/metadata only | metadata-only |
| R3 | `sm-core/.../integration/payment/PaypalTransactionImpl.java` (1) | CREDENTIALS | path/metadata only | metadata-only |
| R4 | `sm-core/.../util/EncryptionUtil.java` (1) | CREDENTIALS | path/metadata only | metadata-only |
| R5 | `sm-core/conf/properties/systems.properties` | CREDENTIALS (DB/SMTP) | deferred from indexing; not read into artifacts | excluded |
| R6 | `sm-core/conf/properties/sm-core-config.properties` | CREDENTIALS | deferred; not read into artifacts | excluded |
| R7 | `sm-shop|sm-central/WebContent/common/js/jquery.meiomask.js` (3+3) | PII (pattern FP-likely) | path-only | metadata-only |
| R8 | `*/common/js/{cookie,jquery-cookie}.js` (2+2+2) | PII | path-only | metadata-only |
| R9 | `sm-shop/.../checkout/subscription/SubscriptionAction.java` (2) | PII | path/metadata only | metadata-only |
| R10 | `sm-core/.../util/www/integration/fb/FacebookIntegrationFactory.java` (1) | CREDENTIALS (API key) | path/metadata only | metadata-only |
| R11 | `sm-core/.../module/impl/application/utils/SimpleCaptchaModule.java` (1) | CREDENTIALS | path/metadata only | metadata-only |
| R12 | `sm-core/.../constants/CatalogConstants.java` (1) | PII/CUSTOM | path-only | metadata-only |
| R13 | `docs/.../admin003/004/006/007.png` (5) | PII (UI screenshots) | excluded from OCR/index | excluded |
| R14 | `test_sensitive_data.txt` (1) | PII (test fixture) | excluded | excluded |
| R15 | `*/WEB-INF/lib/groovy-all-1.5.5-LICENSE.txt` (2) | PII (names in license, FP) | accepted false-positive | metadata-only |

## 3. New high-confidence detections (Stage 1)

**None.** No new high-confidence secrets were detected in the Stage 1 generated
artifacts (`01-discovery/*`, `00-twin/*`). All generated artifacts contain only
source-cited references (file:line), counts, and structural facts — no secret
values, card numbers, or personal data.

> Per `rules/data-redaction.md`, a new high-confidence detection would HALT the
> pipeline and notify HITL. No HALT condition triggered.

## 4. Outstanding (carried to later stages)

- Payment/credit-card hotspots (R1–R4) require deep inspection by `security-analyst`
  (Stage 3) under controlled redaction — must remain metadata-only in the Twin.
- Property-file credentials (R5–R6) must never be committed to the destination repo;
  flag for `cicd-integration` secret-management (Stage 4).

**Stage 1 result:** zero un-redacted secrets left the workspace; all scan-report
categories handled or deferred with rationale.

---

## 5. Stage 2 validation (Digital Twin) — 2026-06-06

Validated all Stage 2 artifacts under `02-reverse/**` before indexing.

| Artifact | Sensitive content? | Action |
|----------|-------------------|--------|
| architecture-as-is.md, data-flows.md, dependency-graph.json | No secrets; references hotspot files by path only | indexed |
| functional-specifications.md, business-rules.md, user-stories.md | No PII/secrets; describe behavior | indexed |
| tech-debt-report.md, obsolescence-matrix.md | No secrets; version/CVE families only | indexed |
| test-cases.md, regression-suite/** | No live credentials; payment tests use **env-var sandbox** creds only | indexed |

**Controls enforced in Stage 2 outputs:**
- Card-data flow (DF in `data-flows.md`) describes `CreditCardUtil`/`EncryptionUtil` by reference only — no card values, keys, or `SecretKeySpec` material embedded (R1–R4 still metadata-only).
- Regression suite forbids live card data; gateway creds via env vars (never committed) — reinforced in `regression-suite/README.md`.
- `MERCHANT_CONFIGURATION` encrypted-credential handling documented as a flow, not extracted.

**New high-confidence detections (Stage 2): none.** No pipeline HALT triggered.

**Stage 2 result:** zero un-redacted secrets in generated artifacts; payment test guidance enforces sandbox-only.

---

## 6. Stage 3 validation (Target Design) — 2026-06-06

Validated all `03-target/**` artifacts and external research before indexing.

| Artifact | Sensitive content? | Action |
|----------|-------------------|--------|
| target-architecture.md, conversion-patterns.md, coding-standards.md | No secrets; design only | indexed |
| api-specifications.yaml | Documents tokenized payment (PAN explicitly excluded); no secrets | indexed |
| security-baseline.md, threat-model.md, remediation-backlog.md | References hotspots by path; no secret values | indexed |
| compliance-matrix.md, data-protection-requirements.md | No PII; policy/control text | indexed |

**External research:** web search/fetch on "OpenClaw" (public articles) — no PII/secrets sent;
queries contained only generic terms. `example/` config (gitignored) read locally; `.env.example`
contains **placeholder** values only (e.g., `admin123`, `change-me...`) — flagged as placeholders,
not real secrets; not indexed into the Twin.

**Design-level redaction guarantees added by target:**
- DPR-0009: runtime redaction before any OpenAI call or index.
- Aquaman: credentials never enter LLM context.
- Tokenization: PAN never stored/sent (RISK-0001).

**New high-confidence detections (Stage 3): none.** No pipeline HALT.

**Stage 3 result:** zero un-redacted secrets; target design embeds redaction/credential-isolation as first-class controls.
