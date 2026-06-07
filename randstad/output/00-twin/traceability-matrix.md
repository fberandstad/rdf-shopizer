# Traceability Matrix — Shopizer Modernization

**Owner:** `documentation-traceability`  **Initialized:** 2026-06-06 (Stage 1)
**Schema:** `REQ-#### | SPEC-#### | code-ref | TEST-#### | status` (SPECS.md §9)

> Seeded in Stage 1 from `01-discovery/discovery-answers.md`. `TEST-####` and
> downstream `code-ref` columns are populated in later stages (QA golden master →
> Stage 2; target code → Stage 4). `pending` = awaiting a later-stage artifact.
> Per `rules/traceability.md`, the final matrix must have **zero orphan rows**.

## Requirements (business / functional)

| REQ | SPEC | code-ref (legacy) | TEST | Status |
|-----|------|-------------------|------|--------|
| REQ-0001 Identity: name | — | README.md:1 | — | seeded |
| REQ-0002 Version 1.1.5 | — | README.md:1 | — | seeded |
| REQ-0003 Release date | — | README.md:3 | — | seeded |
| REQ-0004 Owner/stakeholders | — | README.md:118-122 | — | partial (org owner unknown) |
| REQ-0005 Support contact | — | README.md:122 | — | seeded |
| REQ-0006 Platform (web/Java EE) | SPEC-0023 | README.md:13,97-104 | — | seeded |
| REQ-0008 Business objective | — | README.md:7-11 | — | seeded |
| REQ-0009 User segments | — | OVERVIEW.md:64-89 | — | seeded |
| REQ-0010 Value features | REQ-0014 | OVERVIEW.md:38-54 | pending | seeded |
| REQ-0011 Differentiators | — | payment/shipping modules | — | partial |
| REQ-0012 Revenue model | — | OVERVIEW.md:9 | — | partial (unknown) |
| REQ-0013 Regulation applicability | REQ-0058 | scan report | — | flagged (Stage 3) |
| REQ-0014 Features & modules | SPEC-0024 | module-map.json | pending | seeded |
| REQ-0016 UX measures | SPEC-0015 | web.xml:13-18 | pending | seeded |
| REQ-0021 KPIs | — | — | — | UNKNOWN |
| REQ-0022 Maintenance/support | — | README.md:118-122 | — | partial |
| REQ-0058 Compliance (PCI/GDPR) | SPEC-0056 | scan report | — | flagged (Stage 3) |
| REQ-0069 Roadmap | SPEC-0070 | — | — | pipeline output (Stage 4) |

## Specifications (technical / architectural)

| SPEC | REQ | code-ref (legacy) | TEST | Status |
|------|-----|-------------------|------|--------|
| SPEC-0007 Tech stack | REQ-0006 | OVERVIEW.md:24-31; web.xml; sm-core/build.xml:21-45 | — | seeded |
| SPEC-0015 UI/Tiles/JSP | REQ-0016 | sm-central/.../web.xml:103-106 | pending | seeded |
| SPEC-0017 External integrations | REQ-0017 | module/impl/integration/** | pending | seeded |
| SPEC-0018 Data storage | SPEC-0037 | sm-core/conf/hibernate/*.hbm.xml | — | seeded |
| SPEC-0019 Security measures | SPEC-0054 | sm-central/.../web.xml:11-19 | pending | seeded (gap: HTTPS off) |
| SPEC-0020 Scalability | SPEC-0063 | oscache.properties | — | partial |
| SPEC-0023 Architecture style | REQ-0014 | OVERVIEW.md:13-20 | — | seeded |
| SPEC-0024 Components | SPEC-0023 | app-inventory.md §2 | — | seeded |
| SPEC-0025 Data flows | SPEC-0041 | service/workflow/order/ProcessPayment.java | pending | seeded |
| SPEC-0027 Data entities | SPEC-0018 | sm-core/conf/hibernate/*.hbm.xml (81) | pending | seeded |
| SPEC-0029 Security architecture | SPEC-0054 | sm-central/.../web.xml:11-19 | pending | seeded |
| SPEC-0030 Deployment | SPEC-0067 | README.md:97-99; schema/upgrade | — | seeded |
| SPEC-0031 Design patterns | — | source tree | — | seeded |
| SPEC-0034 Error handling | — | exception/; CentralIntegrationError.hbm.xml | pending | seeded |
| SPEC-0035 Logging | SPEC-0049 | log4j.properties | — | seeded |
| SPEC-0036 Testing strategy | — | (none found) | pending | flagged gap G4 (Stage 2 QA) |
| SPEC-0037 Database | SPEC-0018 | README.md:27-35; schema/ | — | seeded |
| SPEC-0039 Data at rest/in transit | SPEC-0056 | EncryptionUtil.java; web.xml:71-86 | pending | flagged (HTTPS off) |
| SPEC-0041 Integration/endpoints | SPEC-0017 | sm-central/.../web.xml:54-68 | pending | seeded |
| SPEC-0042 API standard (SOAP) | SPEC-0041 | web.xml; corpus-catalog discrepancy | — | seeded |
| SPEC-0043 API docs (WSDL/Javadoc) | — | sm-core/build.xml:86-104 | — | seeded |
| SPEC-0044 API security | SPEC-0054 | web.xml | — | flagged (Stage 3) |
| SPEC-0054 AuthN/AuthZ | SPEC-0019 | CustomAuthFilter; web.xml:11-19 | pending | seeded |
| SPEC-0055 Roles/permissions | SPEC-0054 | MerchantUserRole*.hbm.xml; CentralGroup.hbm.xml | pending | seeded |
| SPEC-0056 Sensitive-data protection | REQ-0058 | EncryptionUtil.java; CreditCardUtil.java | pending | flagged (PCI, Stage 3) |
| SPEC-0062 Optimization (cache) | SPEC-0020 | oscache.properties; web.xml | — | seeded |
| SPEC-0063 Scaling design | SPEC-0020 | start-tomcat.sh:12 | — | partial |
| SPEC-0067 Update/patch | SPEC-0030 | README.md:97-99; schema/upgrade | — | seeded |
| SPEC-0070 Obsolescence strategy | REQ-0069 | README.md:17-22 | — | flagged (Stage 2/3) |

## Open items (UNKNOWN — no legacy evidence; carried forward)

| ID | Topic | Owner stage |
|----|-------|-------------|
| SPEC-0040 | Backup & recovery | Stage 3 |
| SPEC-0045 | API versioning | Stage 3 |
| SPEC-0046 | API performance/monitoring | Stage 3 |
| SPEC-0047/0048/0064 | Monitoring/alerting | Stage 3 |
| SPEC-0051/0053 | Incident mgmt / DR | Stage 3 |
| SPEC-0060/0061 | Load testing / bottlenecks | Stage 2 |
| REQ-0021 | KPIs | Stage 2/3 |

**Orphan check (Stage 1):** all seeded rows trace to a discovery answer + source cite or are explicitly flagged UNKNOWN. No orphan rows. `TEST-####` linkage begins in Stage 2.

---

# Stage 2 extension (Digital Twin) — 2026-06-06

## Architecture specs (SPEC)

| SPEC | Description | code-ref | back-link |
|------|-------------|----------|-----------|
| SPEC-0201 | Layered modular-monolith style | OVERVIEW.md:13-31; web.xml | SPEC-0023 |
| SPEC-0202 | Container topology (3 WARs + DB) | sm-*/build.xml | SPEC-0024 |
| SPEC-0203 | sm-core component model | sm-core/src/.../service/** | SPEC-0027 |
| SPEC-0204 | Order workflow pipelines | sm-core-workflow-beans.xml:21-46 | SPEC-0025 |
| SPEC-0205 | PaymentModule strategy | PaymentModule.java:38-67 | SPEC-0017 |
| SPEC-0206 | Integration points | module/impl/integration/** | SPEC-0041 |
| SPEC-0207 | Security cross-cutting | sm-central/.../web.xml:11-19 | SPEC-0054 |
| SPEC-0208 | Caching/i18n | oscache.properties; web.xml | SPEC-0062 |

## Functional → Rules → Tests

| FS | RULEs | TESTs | code-ref | Status |
|----|-------|-------|----------|--------|
| FS-0001 Catalog | RULE-0007 | TEST-0001..0004 | catalog/*Action.java | linked |
| FS-0002 Cart | RULE-0001..0007 | TEST-0005..0008 | ShoppingCartAction; CAST addToCart | linked |
| FS-0003 Checkout | RULE-0008..0012 | TEST-0009..0011 | checkout/flow/**; workflow-beans | linked |
| FS-0004 Payment | RULE-0009..0012 | TEST-0012..0014 | PaymentModule.java | linked (sandbox) |
| FS-0005 Order/Invoice | RULE-0013,0014,0020 | TEST-0015..0017 | ComitOrderAction; InvoiceAction | linked |
| FS-0006 Customer | RULE-0015 | TEST-0018..0021 | customer/profile/** | linked |
| FS-0007 Subscription | — | TEST-0022 | SubscriptionAction | linked |
| FS-0009 Downloads | RULE-0015 | TEST-0021 | FilesAction | linked |
| FS-0010 Admin auth | RULE-0016,0017 | TEST-0023,0024 | CustomAuthFilter; web.xml | linked |
| FS-0011 Catalog mgmt | — | TEST-0025 | sm-central catalog actions | linked |
| FS-0012 Order/invoice mgmt | — | TEST-0026 | struts-order/invoice.xml | linked |
| FS-0013/0014 Config | RULE-0018,0019,0020 | TEST-0027 | MERCHANT_CONFIGURATION | linked |
| FS-0015 SOAP | SPEC-0041 | TEST-0028 | web.xml:54-68 | linked |

## User stories

US-0001..US-0012 map to FS-0001..FS-0015 (see `user-stories.md`); each carries AC = current behavior locked by the TEST rows above.

## Technical debt (DEBT) → drivers

DEBT-0001..DEBT-0022 (see `tech-debt-report.md`) reference SPEC-0007/0201-0208 and obsolescence-matrix rows. DEBT-0013 (no tests) is mitigated by the Golden Master Suite (TEST-0001..0028).

**Orphan check (Stage 2):** every FS links to ≥1 RULE/REQ and ≥1 TEST; every TEST links to a FS+RULE/REQ; every DEBT links to a component SPEC. No orphan rows. `code-ref` cites local `file:line`. Inferred rules (0004/0019/0021) flagged for confirmation.

---

# Stage 3 extension (Target Design — ShopiClaw) — 2026-06-06

## Legacy capability → target mapping (1:1, no orphans)

| Legacy (FS/RULE) | Target pattern | Artifact ref | DEBT resolved |
|------------------|----------------|--------------|----------------|
| FS-0001 Catalog | `searchCatalog`/`getProduct` tools + `ragSearch` | conversion-patterns §6; api §catalog | DEBT-0005/0011 |
| FS-0002 Cart (RULE-0001..0007) | `getCart`/`addToCart` tools; server pricing | api §cart | DEBT-0006 |
| FS-0003 Checkout (RULE-0008..0012) | order state machine; `createOrder` | conversion §3; api §checkout | DEBT-0003 |
| FS-0004 Payment (RULE-0009..0011) | tokenized payment adapters; `payOrder` guarded | ADR-0006; api /checkout/pay | DEBT-0016 |
| FS-0005 Order/Invoice (RULE-0013/0014) | `getOrderStatus`/`listMyOrders`; masked | api §orders | — |
| FS-0006 Customer (RULE-0015) | account tools; React UI | conversion §6 | — |
| FS-0010..0014 Admin (RULE-0016..0020) | guarded admin tools; RBAC | api §admin | DEBT-0015 |
| FS-0015 SOAP | REST + OpenAPI | ADR-0009; api-specifications.yaml | DEBT-0007 |
| Persistence (81 .hbm.xml) | Prisma schema + pgvector | ADR-0010 | DEBT-0004 |
| Build (Ant/JARs) | pnpm+Vite+Docker+SCA | conversion §1 | DEBT-0009/0021 |
| Runtime (JDK1.5/OSCache) | Node20+Redis, containerized | conversion §1,§4 | DEBT-0001/0008/0019 |
| (new) Self-knowledge | Embedded Digital Twin RAG; `twinKnowledgeSearch` | ADR-0011; target §4.9; api /knowledge/search | — |
| (new) Self-reporting | `getSystemHealth` + `getBusinessMetrics` | ADR-0012; target §4.10; api /ready,/metrics/business | — |
| (new) Agent interop | MCP server | ADR-0013; target §4.11; api /mcp | — |

## ADRs

ADR-0001..ADR-0013 recorded in `target-architecture.md §6` (agentic paradigm, example stack, OpenAI, full rewrite, deterministic money-path, tokenization, ClawBands/Aquaman, Markdown+pgvector memory, REST/OpenAPI, Prisma, embedded-twin-knowledge, named-query analytics, MCP server).

## Security / compliance

| ID range | Description | Artifact |
|----------|-------------|----------|
| RISK-0001..0024 | All 46 scan detections + threat findings (incl. MCP/analytics) reconciled (control/accepted) | remediation-backlog.md |
| DPR-0001..0018 | Data-protection requirements (GDPR/PCI/AI) | data-protection-requirements.md |
| LLM01..LLM10 | Agent threat controls | security-baseline.md §3; threat-model.md §4 |

**Orphan check (Stage 3):** every legacy FS/RULE maps to a target pattern + artifact; every scan detection maps to a RISK (46/46); every DPR links to a control/RISK. No orphan rows. Acceptance tests (golden master TEST-0001..0028 + new guarded-tool tests) assigned to Stage 4.

---

# Stage 4 extension (Code Generation) — Wave 0 (Foundation & Agent Core) — 2026-06-06

## Target pattern → generated code → test

| Target pattern / ADR | Generated file(s) (`04-forward/converted/`) | Test |
|----------------------|----------------------------------------------|------|
| App shell + Randstad theme (example/ fidelity) | `client/src/App.jsx`, `Sidebar.jsx`, `index.css`, `tailwind.config.js` | manual UI / W1 E2E |
| Session auth (DEBT-0015, RISK-0013) | `server/auth.js`, `middleware/rbac.js` | TEST-0023 (integration) |
| Postgres + pgvector data layer (ADR-0010) | `server/db.js`, `migrations.js`, `seed.js` | readiness `/api/ready` |
| Agent loop via CopilotKit+OpenAI (ADR-0001/0002/0003) | `server/agent/gateway.js`, `AGENTS.md`, `SOUL.md` | TEST-W0-01 |
| Typed tool registry (ADR-0005) | `server/agent/tools/index.js`, `TOOLS.md` | TEST-W0-01/03 |
| ClawBands HITL + audit (ADR-0007, RISK-0015) | `server/agent/clawbands.js`, `routes/agent.js` | TEST-W0-01 |
| Aquaman credential isolation (ADR-0007) | `server/agent/aquaman.js` | (W3 payment) |
| Markdown + pgvector memory (ADR-0008) | `server/agent/memory.js`, `MEMORY.md` | (W1) |
| Embedded twin-knowledge RAG (ADR-0011) | `server/rag/{embedder,retriever,ingest}.js`, `routes/knowledge.js`, `client/pages/Knowledge.jsx` | (W1) |
| Self-reporting health/metrics (ADR-0012, AN-2, RISK-0024) | `server/routes/{ops,metricsQueries}.js`, `client/pages/Health.jsx` | TEST-W0-04/05 |
| MCP server default-deny (ADR-0013, RISK-0022/0023) | `server/agent/mcp.js` | TEST-W0-02 |
| Heartbeat scheduler | `server/agent/heartbeat.js` | (W6) |
| Container/build | `Dockerfile`, `docker-compose.yml`, `.env.example` | `node --check` (22/22 pass) |

**Orphan check (W0):** every generated module traces to a target ADR/pattern and a test (unit now, integration/E2E gated by DB/UI in W1+). No orphan rows. Legacy source untouched (read-only).

---

# Stage 4 extension — Wave 1 (Catalog & RAG) — 2026-06-06

## FS-0001 → generated code → test

| Capability | Generated file(s) (`04-forward/converted/`) | Golden master | Unit |
|------------|----------------------------------------------|---------------|------|
| Catalog landing / search | `server/agent/tools/index.js` (`searchCatalog`), `routes/catalog.js`, `client/pages/Storefront.jsx` | TEST-0001, TEST-0004 | TEST-W1-03 |
| Browse by category | `tools/index.js` (`listCategories`), `routes/catalog.js#/categories`, Storefront category chips | TEST-0002 | TEST-W1-01 |
| Product details | `tools/index.js` (`getProduct`, +category), `routes/catalog.js#/products/:sku`, `client/pages/ProductDetail.jsx` | TEST-0003 | TEST-W1-02 |
| Catalog RAG index | `rag/ingest.js` (`ingestCatalog`/`productToText`), `rag/ingest-cli.js`, `routes/rag.js` (admin) | — | TEST-W1-04/05 |
| Agent catalog context | `client/pages/Storefront.jsx` (`useCopilotReadable`) | — | (manual) |
| MCP exposure (read-only) | `tools/index.js` `MCP_SAFE` += `listCategories` | — | TEST-W0-02 |

**Orphan check (W1):** every FS-0001 sub-capability maps to code + a golden-master TEST + a unit test (`npm test` → 10/10). RAG ingest applies redaction (DPR-0009) before embedding. Admin-only `/api/rag/ingest` (RBAC). No orphan rows; legacy source read-only.

---

# Stage 4 extension — Wave 2 (Cart) — 2026-06-06

## FS-0002 / RULE-0001..0007 → generated code → test

| Rule / capability | Generated file(s) (`04-forward/converted/`) | Golden master | Unit |
|-------------------|----------------------------------------------|---------------|------|
| RULE-0001 product exists & enabled | `server/cart.js#addItem` | TEST-0005 | (DB path) |
| RULE-0002 required options present | `server/cart.js#addItem` (`requiredOptions`) | TEST-0005 | (DB path) |
| RULE-0003 positive integer quantity | `server/cart.js` + `tools` zod (`addToCart`) | TEST-0006 | TEST-W2-04 |
| RULE-0004 stock availability | `server/cart.js#addItem/updateItem` | TEST-0005 | (DB path) |
| RULE-0005 same SKU+options merges | `server/cart.js#optionsKey/addItem` | TEST-0007 | TEST-W2-03 |
| RULE-0006 persist for logged-in | `server/cart.js#resolveCart` (user_id) | — | (DB path) |
| RULE-0007 server-authoritative totals | `server/cart.js#computeTotals/toView` | TEST-0005, TEST-0008 | TEST-W2-01/02 |
| Cart REST API | `server/routes/cart.js` (GET/POST/PATCH/DELETE, 422 on validation) | TEST-0008 | — |
| Cart agent tools | `tools/index.js` (`getCart` read; `addToCart`/`updateCart` write, off MCP) | — | TEST-W2-06 |
| Cart UI + mini-cart | `client/pages/Cart.jsx`, `cart/CartContext.jsx`, `ProductDetail.jsx`, `Sidebar.jsx` | TEST-0005/0008 | (manual/E2E) |

**Orphan check (W2):** rules live once in `cart.js`, shared by REST + agent tools (no LLM bypass, ADR-0005). Every RULE maps to code + a golden-master TEST; schema-enforceable rules also have unit tests (`npm test` → 16/16). Tax simplified to a configurable rate (full geo-zone RULE-0019 deferred to checkout wave, flagged). No orphan rows; legacy source read-only.

---

# Stage 4 extension — Wave 3 (Checkout & Payment) — 2026-06-06

## FS-0003/0004 / RULE-0008..0014 / RISK-0001 → generated code → test

| Rule / capability | Generated file(s) (`04-forward/converted/`) | Golden master | Unit |
|-------------------|----------------------------------------------|---------------|------|
| RULE-0008 customer context required | `server/orders.js#assertCustomer/createOrder` | TEST-0009 | TEST-W3-01 |
| RULE-0009 payment per mode (auth/capture) | `server/orders.js#payOrder`, `payments/mock.js` | TEST-0012 | TEST-W3-03 |
| RULE-0010/0011 provider abstraction | `server/payments/index.js` (adapter registry) | TEST-0013 | (adapter) |
| RULE-0012 order persisted only on success | `server/orders.js#payOrder/rollbackOrder` | TEST-0014 | TEST-W3-04 |
| RULE-0013 order owner-scoped | `server/orders.js#getOrder`, `routes/orders.js` | TEST-0016 | (E2E) |
| RULE-0014 payment id masked | `server/orders.js#maskPaymentRef` | TEST-0015 | TEST-W3-06 |
| RULE-0022 confirmation on completion | `server/orders.js#notifyOrderConfirmed` | — | (stub) |
| RISK-0001/DEBT-0016 no PAN (tokenized) | `server/payments/index.js#looksLikePan/assertToken` | — | TEST-W3-02/05 |
| ADR-0007 Aquaman credential isolation | `server/payments/index.js` (useCredential) | — | TEST-W3-03 |
| RISK-0015 payOrder guarded HITL (agent) | `tools/index.js` (`payOrder` guarded), `clawbands.js` | — | TEST-W3-07 |
| Order state machine API | `routes/checkout.js` (order/pay, 402 on decline), `routes/orders.js` | TEST-0009..0017 | (E2E) |
| Checkout/Orders UI | `client/pages/Checkout.jsx`, `Orders.jsx`, `Cart.jsx`, `Sidebar.jsx` | TEST-0011/0015 | (E2E) |
| E2E coverage | `tests/e2e/checkout.e2e.spec.ts` | TEST-0009..0014 | — |

**Orphan check (W3):** order rules live once in `orders.js`/`payments/`, shared by REST (human-present) + agent tool (`payOrder` guarded via ClawBands HITL). No PAN ever enters the system (token-only, Luhn-reject); PSP key used only inside Aquaman; payment ids masked. Payment failure rolls back so no completed order persists (RULE-0012). Unit suite `npm test` → 24/24; DB/UI flows in the W3 E2E spec. No orphan rows; legacy source read-only.

---

# Stage 4 extension — Wave 4 (Orders & Account) — 2026-06-07

## FS-0005/0006/0007/0009 / RULE-0013/0014/0015/0020 → generated code → test

| Rule / capability | Generated file(s) (`04-forward/converted/`) | Golden master | Unit |
|-------------------|----------------------------------------------|---------------|------|
| FS-0006 registration | `server/account.js#register/assertRegistration`, `auth.js` `/register` | TEST-0018 | TEST-W4-01 |
| FS-0006 profile + addresses | `server/account.js`, `routes/account.js` | TEST-0019 | TEST-W4-02 |
| FS-0006 product reviews | `server/content.js#submitReview/listReviews`, `routes/catalog.js` | TEST-0020 | TEST-W4-03/07 |
| FS-0007 newsletter (PII+consent) | `server/content.js#subscribe`, `routes/newsletter.js` | TEST-0022 | (E2E) |
| FS-0005 invoice summary | `server/content.js#getInvoice`, `routes/orders.js` `/:id/invoice` | TEST-0017 | (E2E) |
| RULE-0014 masked payment | `server/orders.js#maskPaymentRef` (reused) | TEST-0015 | TEST-W3-06 |
| RULE-0020 supported cards per store | `server/content.js#supportedCards` | TEST-0017 | TEST-W4-04 |
| RULE-0013 order owner-scoped | `server/orders.js#getOrder` (non-owner → 404) | TEST-0016 | (E2E) |
| FS-0009/RULE-0015 gated download | `server/content.js#canDownload/authorizeDownload`, `routes/files.js` | TEST-0021 | TEST-W4-05 |
| Agent tools (reviews/newsletter) | `tools/index.js` (`listProductReviews` read+MCP; `submitReview`/`subscribeNewsletter` write, off MCP) | — | TEST-W4-06 |
| Account/Orders UI | `client/pages/Account.jsx`, `Login.jsx` (register), `ProductDetail.jsx` (reviews+download), `Sidebar.jsx` | TEST-0018..0021 | (E2E) |
| E2E coverage | `tests/e2e/account.e2e.spec.ts` | TEST-0015..0022 | — |

**Orphan check (W4):** account/content logic centralized in `account.js`/`content.js`, shared by REST + agent tools. Owner-scoping enforced (addresses, orders, reviews tied to `user_id`); non-owner order reads return 404 (no info leak, RULE-0013). Digital downloads require admin or a PAID order (RULE-0015). Newsletter stores PII with explicit consent (FS-0007/DPR R9); payment data masked (RULE-0014). Unit suite `npm test` → 31/31; full Playwright suite → 21/21. No orphan rows; legacy source read-only.
