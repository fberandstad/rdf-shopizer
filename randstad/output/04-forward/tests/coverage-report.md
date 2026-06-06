# Coverage Report — Stage 4

## Wave 0 — Foundation & Agent Core

| Area | Test | Type | Status |
|------|------|------|--------|
| Tool registry contract | TEST-W0-01 | unit | green |
| MCP default-deny / read-only allow-list | TEST-W0-02 | unit (→ RISK-0022/0023) | green |
| Tool input validation (Zod) | TEST-W0-03 | unit | green |
| Business metrics role scoping | TEST-W0-04 | unit (→ AN-2) | green |
| No free-form SQL (named queries) | TEST-W0-05 | unit (→ RISK-0024) | green |
| Auth round-trip | TEST-0023 | integration (curl) | manual / DB-gated |
| Health & readiness | health | integration (curl) | manual / DB-gated |

**Notes**
- Unit suite runs without a database (pure policy/validation paths).
- Integration smoke requires Postgres+pgvector (docker compose) and is documented in
  `tests/w0/README.md`.
- Golden-master Playwright E2E (`02-reverse/regression-suite/`) is wired from W1 when the
  catalog/cart/checkout UIs exist.

## Wave 1 — Catalog & RAG

| Area | Test | Maps to | Type | Status |
|------|------|---------|------|--------|
| Categories tool + MCP exposure | TEST-W1-01 | TEST-0001/0002 | unit | green |
| Product detail contract | TEST-W1-02 | TEST-0003 | unit | green |
| Catalog search params | TEST-W1-03 | TEST-0004 | unit | green |
| ragSearch collection guard | TEST-W1-04 | RISK (scope) | unit | green |
| Catalog RAG text builder | TEST-W1-05 | FS-0001 (RAG relevance) | unit | green |

**Total unit suite: 10 passing** (`npm test`). Integration/E2E (TEST-0001..0004 via Playwright)
runs against a seeded, running app — documented in `tests/w0/README.md`.

## Wave 2 — Cart (FS-0002, RULE-0001..0007)

| Area | Test | Maps to | Type | Status |
|------|------|---------|------|--------|
| Server-side totals (RULE-0007) | TEST-W2-01 | TEST-0005/0007 | unit | green |
| Empty-cart totals | TEST-W2-02 | FS-0002 | unit | green |
| Option-set merge key (RULE-0005) | TEST-W2-03 | TEST-0007 | unit | green |
| Positive-quantity guard (RULE-0003) | TEST-W2-04 | TEST-0006 | unit | green |
| Update/remove quantity (FS-0002) | TEST-W2-05 | TEST-0008 | unit | green |
| Cart write tools off MCP (default-deny) | TEST-W2-06 | RISK-0022/0023 | unit | green |

**Total unit suite: 16 passing** (`npm test`). DB-backed rule paths (stock RULE-0004,
required options RULE-0002, persistence RULE-0006, line merge) are enforced in `cart.js`
and exercised by the Playwright golden master (TEST-0005..0008) against a seeded app.

## End-to-end (Playwright, modern app) — 2026-06-06

Run against the live stack (Postgres+pgvector container on :15432, API server on :4000,
seeded data). Harness: `04-forward/tests/e2e/` (`npm install && npx playwright install
chromium && npx playwright test`).

| TEST | Journey | Result |
|------|---------|--------|
| TEST-0001 | Catalog landing renders seeded products | **pass** |
| TEST-0002 | Browse by category filters | **pass** |
| TEST-0003 | Product details (name/price/attrs/add-to-cart) | **pass** |
| TEST-0004 | Search returns matches | **pass** |
| TEST-0005 | Add valid product; server totals + mini-cart | **pass** |
| TEST-0006 | Invalid qty rejected 422 (RULE-0003) | **pass** |
| TEST-0007 | Same SKU merges to one line (RULE-0005) | **pass** |
| TEST-0008 | Update/remove recomputes totals (RULE-0007) | **pass** |

**E2E result: 8/8 passing.** Integration smoke (liveness, readiness, login, auth/me,
catalog, cart merge) also green via curl.

### Bugs found & fixed during verification
- **Server crash (P1):** CopilotKit runtime telemetry threw `lambdaClient.send is not a
  function` on an async tick, killing the process whenever the agent runtime was hit.
  Fixed by disabling telemetry before the runtime loads (`server/agent/gateway.js`;
  `COPILOTKIT_TELEMETRY_DISABLED`/`DO_NOT_TRACK`, documented in `.env.example`).
- **Readiness probe behind auth:** `/api/ops/ready` returned 401; added to the public
  probe allow-list in `server/index.js` (RISK-0024 self-reporting).
- (Test-only) `index.js` `cartRoutes` require had been dropped on disk — restored.

## Pending (later waves)
- W3: TEST-0009..0014 (checkout/payment, tokenization, ClawBands HITL)
- W4–W7: orders/account, admin/analytics, interop/heartbeat, hardening/compliance.
