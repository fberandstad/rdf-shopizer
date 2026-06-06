# W0 Tests — Foundation & Agent Core

## Unit tests (no DB)
`agent-core.test.js` validates the agent-core invariants that gate the whole pipeline:
tool-contract completeness, MCP default-deny, Zod input validation, and role-scoped /
allow-listed analytics.

```bash
# from the converted app (deps must be installed once)
cd ../../converted/server && npm install
# Node 22 needs an explicit file path (not a bare directory):
node --test ../../tests/w0/agent-core.test.js
# or simply:
npm test
```

Verified result: **5 passing** (TEST-W0-01..05), no DB required.

## Integration smoke (needs Postgres + pgvector)
With `docker compose up -d db` and the server running on :4000:

```bash
# health (TEST-0023 precondition)
curl -fsS localhost:4000/api/health
# readiness
curl -fsS localhost:4000/api/ready
# auth round-trip (default admin from .env)
curl -fsS -c jar -X POST localhost:4000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@randstad.fr","password":"<DEFAULT_ADMIN_PASSWORD>"}'
curl -fsS -b jar localhost:4000/auth/me
```

Golden-master E2E (Playwright) from `02-reverse/regression-suite/` runs against the
running app in W1+ once catalog/cart/checkout UIs land.
