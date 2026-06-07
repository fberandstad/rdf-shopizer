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

## Wave 3 — Checkout & Payment (FS-0003/0004, RULE-0008..0012, RISK-0001)

| Area | Test | Maps to | Type | Status |
|------|------|---------|------|--------|
| Customer context required (RULE-0008) | TEST-W3-01 | TEST-0009 | unit | green |
| No-PAN guard / token-only (RISK-0001) | TEST-W3-02 | — | unit | green |
| Tokenized charge approves (Aquaman key) | TEST-W3-03 | TEST-0011/0012 | unit | green |
| Declined charge → not-ok (rollback driver) | TEST-W3-04 | TEST-0014 | unit | green |
| PAN never reaches PSP | TEST-W3-05 | RISK-0001 | unit | green |
| Payment id masked (RULE-0014) | TEST-W3-06 | TEST-0015 | unit | green |
| payOrder guarded+off-MCP; createOrder write | TEST-W3-07 | RISK-0015/0022 | unit | green |
| payOrder schema validation | TEST-W3-08 | FS-0004 | unit | green |
| Shipping method selection adds cost (RULE-0007) | TEST-W3-09 | TEST-0010 | unit | green |

**Total unit suite: 25 passing** (`npm test`). DB-backed flows (order state machine,
rollback-on-failure, stock decrement, cart clear, owner-scoped reads) are covered by the
W3 E2E spec (`tests/e2e/checkout.e2e.spec.ts`, TEST-0009..0014) against the live stack.

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
| TEST-0009 | createOrder requires customer context (RULE-0008) | **pass** |
| TEST-0010 | Shipping-method selection adds server-side cost to order totals (FS-0003) | **pass** |
| TEST-0011/12 | Tokenized payment places order → PAID, cart cleared | **pass** |
| TEST-0014 | Declined payment persists NO order (RULE-0012, rollback→404) | **pass** |
| TEST-PCI | Raw card number rejected 422 (RISK-0001) | **pass** |
| TEST-0013 | Order owner-scoped read, payment masked, no token leak | **pass** |

| TEST-0018 | Register customer + authenticate (FS-0006) | **pass** |
| TEST-0019 | Profile update + address CRUD (owner-scoped) | **pass** |
| TEST-0019b | Invalid address rejected 422 | **pass** |
| TEST-0020 | Product review tied to customer; rating bounds | **pass** |
| TEST-0022 | Newsletter subscribe (PII + consent; no-consent 422) | **pass** |
| TEST-0015/17 | Invoice masked payment + supported cards (RULE-0020) | **pass** |
| TEST-0016 | Order access control — non-owner 404 (RULE-0013) | **pass** |
| TEST-0021 | Digital download gated — no purchase 403, admin 200 (RULE-0015) | **pass** |

| TEST-0023 | Admin endpoints require auth (401) | **pass** |
| TEST-0024 | RBAC: non-admin forbidden (403, RULE-0017) | **pass** |
| TEST-0025 | Admin catalog CRUD → appears in storefront (FS-0011) | **pass** |
| TEST-0026 | Admin order status transitions persist; illegal → 409 (FS-0012) | **pass** |
| TEST-0027 | Gateway secret encrypted, never echoed/masked (RULE-0018) | **pass** |

| TEST-0028 | SOAP→REST: service descriptor + OpenAPI reachable (replaces WSDL) | **pass** |
| TEST-0028b | Interop invoice service masked payment; raw token never exposed | **pass** |
| MCP | initialize + tools/list (inputSchema), guarded hidden, default-deny 403 | **pass** |
| MCP-auth | invalid/absent client token → 401 | **pass** |
| Heartbeat | admin runs jobs → notifications persisted (briefing) | **pass** |

| RISK-0011 | Security headers/CSP present (nosniff, frame-options, no X-Powered-By) | **pass** |
| DPR-0012 | AI transparency disclosure public + rights listed | **pass** |
| DPR-0005 | Data export returns subject's personal data | **pass** |
| DPR-0006 | Erasure removes PII + scrubs creds (cascade incl. pgvector) | **pass** |
| DPR-0008 | Marketing consent withdrawal | **pass** |
| DPR-0011 | Admin retention purge | **pass** |

**E2E result: 39/39 passing** (catalog 4 + cart 4 + checkout 6 + account 8 + admin 5 + interop/MCP/heartbeat 6 + compliance 6).
Checkout now includes TEST-0010 (shipping-method selection adds server-authoritative cost to totals).
Integration smoke (liveness, readiness, login, auth/me, catalog, cart merge) also green via curl.
Note: MCP/interop data endpoints need a client token — start the server with
`MCP_CLIENT_TOKENS='{"partner":"interop-test-token"}'` for the interop E2E spec, and run
`node seed.js` first (seed now resets stock on re-run) for deterministic checkout tests.

## Wave 7 — Hardening & Compliance (RISK-0010/0011/0020, DPR-0005/0006/0008/0011/0012)

| Area | Test | Maps to | Type | Status |
|------|------|---------|------|--------|
| CSP locks sources (XSS/clickjacking) | TEST-W7-01 | RISK-0011 | unit | green |
| Security headers applied; fingerprint stripped | TEST-W7-02 | RISK-0010/0011 | unit | green |
| Retention cutoff window correct | TEST-W7-03 | DPR-0011 | unit | green |
| Consent withdrawal validates before write | TEST-W7-04 | DPR-0008 | unit | green |

**Total unit suite: 46 passing** (`npm test`). DB/HTTP compliance flows in `tests/e2e/compliance.e2e.spec.ts`.
CI/CD pipeline (gated, no auto-deploy): `converted/.github/workflows/ci.yml` (gitleaks + npm audit + unit + Playwright E2E with pgvector service).

## Wave 6 — Interop & Heartbeat (FS-0015, ADR-0009/0013)

| Area | Test | Maps to | Type | Status |
|------|------|---------|------|--------|
| Notification formatters (PII-minimized) | TEST-W6-01 | RULE-0022 | unit | green |
| Abandoned-cart detection (pure) | TEST-W6-02 | heartbeat | unit | green |
| Deterministic LLM escalation (cost control) | TEST-W6-03 | heartbeat | unit | green |
| MCP default-deny money-path | TEST-W6-04 | RISK-0022 | unit | green |
| Notification validation | TEST-W6-05 | — | unit | green |

**Total unit suite: 42 passing** (`npm test`). DB/HTTP/protocol flows in `tests/e2e/interop.e2e.spec.ts`.

## Wave 5 — Admin & Analytics (FS-0011..0014, RULE-0016..0020)

| Area | Test | Maps to | Type | Status |
|------|------|---------|------|--------|
| Product validation (catalog CRUD) | TEST-W5-01 | TEST-0025 | unit | green |
| Order status transitions (forward-only) | TEST-W5-02 | TEST-0026 | unit | green |
| Gateway secret encrypt/decrypt + mask (RULE-0018) | TEST-W5-03 | TEST-0027 | unit | green |
| RBAC middleware 401/403/allow | TEST-W5-04 | TEST-0023/0024 | unit | green |
| Admin tools guarded + off MCP | TEST-W5-05 | RISK-0015/0022 | unit | green |
| Inventory tool schema | TEST-W5-06 | FS-0011 | unit | green |

**Total unit suite: 37 passing** (`npm test`). DB/HTTP/RBAC flows in `tests/e2e/admin.e2e.spec.ts`.

## Wave 4 — Orders & Account (FS-0005/0006/0007/0009, RULE-0013/0014/0015/0020)

| Area | Test | Maps to | Type | Status |
|------|------|---------|------|--------|
| Registration validation + email normalize | TEST-W4-01 | TEST-0018 | unit | green |
| Profile + address validation | TEST-W4-02 | TEST-0019 | unit | green |
| Review rating bounds (RULE) | TEST-W4-03 | TEST-0020 | unit | green |
| Supported cards per store (RULE-0020) | TEST-W4-04 | TEST-0017 | unit | green |
| Download authorization (RULE-0015) | TEST-W4-05 | TEST-0021 | unit | green |
| Tool sensitivities + MCP policy | TEST-W4-06 | RISK-0022 | unit | green |
| Review tool schema bounds | TEST-W4-07 | FS-0006 | unit | green |

**Total unit suite: 31 passing** (`npm test`). DB/HTTP flows in `tests/e2e/account.e2e.spec.ts`.

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
