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

## Pending (later waves)
- W1: TEST-0001..0004 (catalog + RAG)
- W2: TEST-0005..0008 (cart + server pricing)
- W3: TEST-0009..0014 (checkout/payment, tokenization, ClawBands HITL)
- W4–W7: orders/account, admin/analytics, interop/heartbeat, hardening/compliance.
