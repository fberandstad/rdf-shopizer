# Conversion Patterns — Legacy Shopizer → ShopiClaw

**Owner:** `coding-framework`  **Stage:** 3  **Generated:** 2026-06-06
**Purpose:** 1:1 mapping from every legacy pattern (Stage 2 as-is) to a target pattern.
**Rule:** no orphan legacy component; each maps to a target tool/service/component + test.

## 1. Platform & build

| Legacy | Target | Notes |
|--------|--------|-------|
| JDK 1.5 (DEBT-0001) | Node.js 20 + TypeScript | full runtime change |
| Apache Ant (DEBT-0009) | pnpm + Vite + tsc; Docker multi-stage | dependency mgmt + SBOM |
| WAR on Tomcat | Container (node:20) + docker-compose | cloud-ready (resolves DEBT-0019) |
| vendored JARs (DEBT-0021) | npm registry + lockfile + SCA | supply-chain visibility |

## 2. Web / presentation

| Legacy | Target | Notes |
|--------|--------|-------|
| Struts 2 Action (`*Action.java`) | Express route/controller (`/api/*`) **and** agent tool | money-path deterministic; agent orchestrates |
| `struts-*.xml` action maps | TypeScript route registry + OpenAPI | `api-specifications.yaml` |
| JSP + Apache Tiles (DEBT-0005,0011) | React components + layout; CopilotKit generative UI | inherit `example/` look&feel |
| DWR AJAX (DEBT-0006) | REST/JSON + React Query; agent tool calls | drop DWR |
| `CustomAuthFilter` (DEBT-0015) | Express session middleware + RBAC guard | + ClawBands for agent tools |
| JSTL/label bundles | i18n (i18next) | locale/currency from session/store |

## 3. Business / services

| Legacy | Target | Notes |
|--------|--------|-------|
| Spring 2.5 XML DI (DEBT-0003) | TS modules + DI (tsyringe/manual) | annotation/config-free |
| Service layer (`*Service`) | TS service modules (`/server/services/*`) | preserve domain boundaries |
| `OrderWorkflowProcessor` (RULE-0008..0012) | Deterministic **order state machine** invoked by `placeOrder`/`payOrder` tools | steps: customer→payment→order→email |
| `PaymentModule` Strategy (RULE-0009..0011) | Payment **provider adapters** (tokenized) behind `payOrder` tool | hosted fields/tokens (ADR-0006) |
| Shipping `*QuotesImpl` | Carrier adapter interfaces behind `calculateShipping` | FedEx/UPS/USPS/CanadaPost |
| Tax (`GeoZoneTaxTemplate`, RULE-0019) | Tax service behind `calculateTax` | confirm inferred rule |
| `EncryptionUtil`/`CreditCardUtil` (DEBT-0016) | **Removed** — tokenization; secrets via Aquaman broker | PCI scope reduction |

## 4. Persistence

| Legacy | Target | Notes |
|--------|--------|-------|
| Hibernate 3 XML `.hbm.xml` (81) (DEBT-0004) | **Prisma** schema + migrations | type-safe models |
| HSQLDB/MySQL/Oracle | PostgreSQL 16 + pgvector | single target DB |
| `MERCHANT_CONFIGURATION` encrypted blobs (RULE-0018) | Config table + **secret broker** refs | no plaintext/keys in DB |
| OSCache (DEBT-0008) | Redis | sessions/cart/heartbeat locks |

## 5. Integration

| Legacy | Target | Notes |
|--------|--------|-------|
| JAX-WS/Axis SOAP (DEBT-0007) | REST + OpenAPI (ADR-0009) | `salesManagerCustomerService`/`InvoiceService` → REST resources |
| log4j 1.x (DEBT-0010) | pino + OpenTelemetry | structured logs + traces |
| Email (`EmailUtil`/SMTP) | Notification service (SMTP/provider) | + agent heartbeat triggers |
| Facebook integration | OAuth/social module (optional) | feature-flag |

## 6. Legacy → agentic (new capability mapping)

| Legacy behavior | ShopiClaw agentic surface |
|-----------------|---------------------------|
| Catalog browse (FS-0001) | `searchCatalog`/`getProduct` tools + `ragSearch`; conversational discovery |
| Cart (FS-0002) | `getCart`/`addToCart`/`updateCart` tools; agent assists, server computes totals (RULE-0007) |
| Checkout (FS-0003,0004) | `createOrder`/`payOrder` (guarded, tokenized); agent guides, state machine executes |
| Order/invoice (FS-0005) | `getOrderStatus`/`listMyOrders`; agent answers grounded in data; masked payment (RULE-0014) |
| Customer (FS-0006) | account tools; profile/address; reviews |
| Admin (FS-0010..0014) | `manageCatalog`/`manageInventory`/`requestRefund` (guarded, admin role) |
| SOAP services (FS-0015) | REST resources + tools |
| (new) Proactive ops | Heartbeat: abandoned-cart, low-stock, briefings |
| (new) Self-knowledge | `twinKnowledgeSearch` over embedded Digital Twin (00-twin/02-reverse/03-target) with cited answers |
| (new) Self-reporting | `getSystemHealth` (/health,/ready) + `getBusinessMetrics` (named allow-listed queries: orders processed, revenue, abandonment...) |
| (new) Agent interop | MCP server (`/mcp`) exposing read/safe tools + twin resources to external agents; guarded tools gated |

## 7. Behavior-preservation contract

- Each mapped target capability is verified against the matching **golden-master TEST**
  (TEST-0001..0028). A wave is "done" only when its TESTs pass on the target.
- **Business rules RULE-0001..0022 are invariant** across migration; agent tools must
  enforce them server-side (esp. RULE-0007 server-side pricing, RULE-0013 order access,
  RULE-0016/0017 admin authz).
- Inferred rules (RULE-0004/0019/0021) confirmed during implementation.

## 8. Anti-patterns to avoid (from CAST modern-fork + LLM risks)

- No business decisions taken solely by the LLM (use deterministic services).
- No secrets/PII in prompts (Aquaman; redaction).
- No client-trusted prices/totals (server authoritative).
- No unbounded agent autonomy on money-path (ClawBands approval).
