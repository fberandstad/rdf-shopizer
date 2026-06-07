---
stage: 4
decision: pending
reviewer: ""
timestamp: ""
gate: stage-4-approval
recorded_by: tech-debt-manager (submission only; awaiting hitl-gatekeeper)
comments: []
---

# Stage 4 — Code Generation: Submission for HITL Approval

**Status:** SUBMITTED — awaiting human approval. Per `rules/hitl-gates.md`, this stage does
not transition and **no dest-repo PR / deploy is performed** until
`approvals/stage-4.md` exists with `decision: approved` (written by `hitl-gatekeeper`).

## What was delivered (all 8 waves)

The legacy Shopizer (Java/Struts/Hibernate/SOAP monolith) was reverse-engineered into a
Digital Twin and forward-engineered into **ShopiClaw**, an agentic Node + React commerce app
(`04-forward/converted/`). Legacy `sm-*`/`schema` remained **read-only** throughout.

| Wave | Scope | Golden master |
|------|-------|---------------|
| W0 | Foundation, auth/RBAC, Postgres+pgvector, ShopiClaw agent (CopilotKit/OpenAI), ClawBands, Aquaman, MCP, RAG, twin-knowledge | auth/health |
| W1 | Catalog + RAG tools | TEST-0001..0004 |
| W2 | Cart (server-authoritative pricing) | TEST-0005..0008 |
| W3 | Checkout & tokenized payment (no PAN) | TEST-0009..0014 |
| W4 | Orders, account, reviews, newsletter, masked invoice | TEST-0015..0022 |
| W5 | Admin catalog/inventory/orders, analytics, encrypted gateway config | TEST-0023..0027 |
| W6 | Full MCP server, Heartbeat jobs, notifications, SOAP→REST interop | TEST-0028 |
| W7 | Security headers/CSP, rate limits, GDPR (export/erasure/consent/retention), AI transparency, CI/CD | RISK/DPR controls |

## Verification (reproducible)

- **Unit + golden-master (offline):** `cd converted/server && npm test` → **47/47 pass**.
- **End-to-end (Playwright):** `cd converted/tests/e2e && npx playwright test` → **39/39 pass**
  (server started with `MCP_CLIENT_TOKENS='{"partner":"interop-test-token"}'`; run `node seed.js`
  first to reset stock).
- **Golden-master TEST-0001..0028: all green** on the target (TEST-0010 shipping-method
  selection now fully implemented in W3, not just estimated).
- Client builds clean (`converted/client && npm run build`).
- Traceability matrix: Stage-4 sections W0..W7, **no orphan rows**; NFR checklist consolidated.

## Carried Stage-3 conditions — disposition

- **PSP tokenization (ADR-0006, DPR-0003):** implemented; no PAN anywhere (mock PSP adapter; real creds via env). ✅ code / ⚠ ops: select live PSP.
- **Vector-erasure tooling (DPR-0006):** implemented — erasure cascades to `agent_memory` (pgvector). ✅
- **Consent capture/withdrawal (DPR-0008):** implemented. ✅
- **Retention jobs (DPR-0011):** implemented. ✅
- **DPIA/RoPA (DPR-0015/0018):** documented in `converted/docs/compliance/`. ✅
- **OpenAI DPA / EU region (DPR-0017):** documented; ⚠ ops action (contractual/config).
- **Golden-master E2E on target:** executed, 39/39. ✅
- **Inferred rules RULE-0004/0019/0021, legacy JAR versions V1-V3:** ⚠ still flagged unknown (no fabrication).

## Production-affecting actions requiring EXPLICIT per-action approval (NOT done)

1. Create branch + open PR to destination repo `github.com/fberandstad/rdf-shopizer`.
2. Run/enable the CI/CD pipeline (`.github/workflows/ci.yml`) in the dest repo.
3. Any deploy. These remain **manual and gated**; none were auto-run.

## Requested decision

Please review and, if acceptable, have `hitl-gatekeeper` record `approvals/stage-4.md`
with `decision: approved`. On approval, the dest-repo PR will be prepared for a final
per-action human approval before push.
