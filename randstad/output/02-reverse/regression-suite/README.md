# Regression Suite — Golden Master (Shopizer v1.1.5)

**Owner:** `quality-assurance`  **Stage:** 2

Characterization (golden-master) E2E suite that locks the **current** behavior of the
legacy app so migration can be verified for regression safety. Built with Playwright.

## Design

- **Safe by default:** if `BASE_URL_SHOP` / `BASE_URL_CENTRAL` are not set, all E2E specs
  **skip** (suite still exits green). This honors the workflow rule that E2E capture
  requires the running legacy app and is **not auto-run**.
- Each spec maps 1:1 to `TEST-####` in `../test-cases.md`, which link to REQ/RULE/FS.

## Prerequisites to run E2E

1. Start the legacy app (manual):
   ```bash
   ./start-tomcat.sh    # from repo root
   ```
   Shop: `http://localhost:9080/shop/`  ·  Central: `http://localhost:9080/central/`
2. Install + run:
   ```bash
   cd randstad/output/02-reverse/regression-suite
   npm install
   npx playwright install chromium
   BASE_URL_SHOP=http://localhost:9080/shop \
   BASE_URL_CENTRAL=http://localhost:9080/central \
   ADMIN_USER=<user> ADMIN_PASS=<pass> \
   npm test
   ```
3. Capture golden baselines (first green run) and commit the trace under `baselines/`.

## Safety

- **Never** use live card data. Payment tests (TEST-0012/0013/0014) require **sandbox**
  gateway credentials and are tagged `@sandbox`.
- Credentials come from env vars only — never hard-code (see `00-twin/redaction-log.md`).

## Layout

```
regression-suite/
├── package.json
├── playwright.config.ts
├── tests/
│   ├── catalog.spec.ts     # TEST-0001..0004
│   ├── cart.spec.ts        # TEST-0005..0008
│   ├── checkout.spec.ts    # TEST-0009..0017 (payment @sandbox)
│   ├── customer.spec.ts    # TEST-0018..0022
│   └── admin.spec.ts       # TEST-0023..0028
└── baselines/              # captured golden outputs (created on first run)
```
