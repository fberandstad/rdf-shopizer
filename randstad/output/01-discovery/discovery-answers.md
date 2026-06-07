# Discovery Answers — Shopizer v1.1.5 (70-question set)

**Owner:** `appmod-analyst`  **Stage:** 1  **Generated:** 2026-06-06  **Gate:** stage-1-approval
**Source set:** `docs/Application Discovery (AI-powered).md`

> Every answer cites a local `file:line` or document, or is explicitly marked
> **UNKNOWN**. Each answer carries a traceability ID (`REQ-####` business/functional,
> `SPEC-####` technical/architectural) seeded into `00-twin/traceability-matrix.md`.
> **Note:** the source questionnaire numbering skips #52 (jumps 51 → 53); 69 distinct
> questions are listed. All are answered below; the gap is preserved and flagged.

---

## A. Application context (Q1–Q22)

**Q1 — Official name** · `REQ-0001`
Shopizer. Source: `README.md:1`, `OVERVIEW.md:1`.

**Q2 — Current version** · `REQ-0002`
1.1.5. Source: `README.md:1`.

**Q3 — Release date** · `REQ-0003`
2011-08-14. Source: `README.md:3`.

**Q4 — Owner / stakeholders** · `REQ-0004`
Shopizer project / SalesManager (package `com.salesmanager`). Original vendor team. Source: `README.md:118-122`. Current organizational owner **UNKNOWN** (not in repo).

**Q5 — Contact info** · `REQ-0005`
`support@shopizer.com`. Source: `README.md:122`.

**Q6 — Platform(s)** · `REQ-0006`
Server-side web application (Java EE WARs deployed to a servlet container); browser front-end. Source: `README.md:13,97-104`.

**Q7 — Technologies / frameworks** · `SPEC-0007`
Java (JDK 1.5+), Ant, Struts 2, Spring, Hibernate, Apache Tiles, DWR, JAX-WS/Axis, OSCache, log4j, JasperReports/Groovy. Source: `OVERVIEW.md:24-31`, `web.xml` (both apps), `sm-core/build.xml:21-45`.

**Q8 — Business objective** · `REQ-0008`
Online sales management: online catalogue, shopping cart, order fulfillment, online invoicing. Source: `README.md:7-11`.

**Q9 — Main users / segments** · `REQ-0009`
(a) End customers (storefront `sm-shop`); (b) store administrators/merchants (`sm-central`). Source: `OVERVIEW.md:64-89`.

**Q10 — Value-providing features** · `REQ-0010`
Catalog management, cart, checkout/payment, order fulfillment, invoicing, multi-store/merchant config, multi-currency/locale. Source: `OVERVIEW.md:38-54`.

**Q11 — Differentiators** · `REQ-0011`
Multi-gateway payments (9), multi-carrier shipping quotes (Fedex/UPS/USPS/CanadaPost), multi-DB support, multi-language. Marketing differentiation **UNKNOWN**. Source: payment/shipping module dirs.

**Q12 — Revenue model** · `REQ-0012`
Self-hosted commerce platform enabling merchant online sales (transaction/order driven). Licensing LGPL (open source). Direct monetization model **UNKNOWN**. Source: `OVERVIEW.md:9`.

**Q13 — Industry regulation / compliance** · `REQ-0013`
Handles credit-card/payment + PII → PCI-DSS and GDPR relevant (financial + PII detections in scan report). No explicit compliance docs in repo — **flagged** for Stage 3 (`compliance-analyst`). Source: `docs/📊 Aggregate Scan Summary Report.md`.

**Q14 — Main features & modules** · `REQ-0014`
4 modules (sm-core, sm-central, sm-shop, schema); features: catalog, cart, checkout, customer, order, payment, shipping, tax, invoice, merchant/store config. Source: `00-twin`/`app-inventory.md §2,§4`, Tiles defs in `sm-central/.../web.xml:103-106`.

**Q15 — Design approach & UI** · `SPEC-0015`
Server-rendered JSP views composed via Apache Tiles; jQuery + DWR for client interactions; CKEditor in admin. Source: `web.xml` Tiles context-params; `sm-central/WebContent/common/ckeditor/`, `*/common/js/jquery*`.

**Q16 — Positive UX measures** · `REQ-0016`
AJAX (DWR), client-side validation (`jquery.meiomask.js`), multi-language label bundles (`TemplateResourceBundleLoader`). Formal UX testing **UNKNOWN**. Source: `web.xml:13-18`.

**Q17 — External systems / APIs integrated** · `SPEC-0017`
Payment gateways (Paypal, BeanStream, AuthorizeNet, Moneris, Psigate); shipping carriers (Fedex, UPS, USPS, CanadaPost); Facebook; SMTP email. Source: integration module dirs; `FacebookIntegrationFactory.java`.

**Q18 — Data collection/storage/management** · `SPEC-0018`
Relational DB via Hibernate ORM (81 mappings); entities for customers, orders, products, payments. Source: `sm-core/conf/hibernate/*.hbm.xml`.

**Q19 — Security measures** · `SPEC-0019`
Admin auth via `CustomAuthFilter` (`*.action`); method-level checks; `EncryptionUtil`/`SecurityUtil`; optional HTTPS `transport-guarantee` (commented out in `web.xml`). Source: `sm-central/.../web.xml:11-19,109-134`; `sm-core/.../util/EncryptionUtil.java`. **Gap:** HTTPS constraint disabled.

**Q20 — Scalability / load handling** · `SPEC-0020`
Stateful servlet web apps; OSCache caching; horizontal scale would need session/cache externalization. No clustering config in repo — **UNKNOWN/limited**. Source: `oscache.properties`.

**Q21 — KPIs** · `REQ-0021`
**UNKNOWN** — no analytics/KPI definitions in repo.

**Q22 — Maintenance & support post-launch** · `REQ-0022`
Community/vendor support via `support@shopizer.com`. Formal SLA/maintenance process **UNKNOWN**. Source: `README.md:118-122`.

---

## B. Architecture (Q23–Q36)

**Q23 — Architecture style** · `SPEC-0023`
Modular monolith: shared core library (`sm-core`) + two server-rendered MVC web apps + DB. Layered (web → service → DAO → ORM). Source: `OVERVIEW.md:13-20`, build dependency graph.

**Q24 — Main components & responsibilities** · `SPEC-0024`
sm-core (entities/services/integrations/workflow), sm-central (admin UI + SOAP), sm-shop (storefront), schema (DB). Source: `app-inventory.md §2`.

**Q25 — Data flows between components** · `SPEC-0025`
Web apps → sm-core services → Hibernate → DB; checkout → payment workflow (`ProcessPayment`) → external gateway. SOAP services exposed from sm-central. Source: `sm-core/.../service/workflow/order/ProcessPayment.java`; `web.xml`.

**Q26 — Key technologies/tools** · `SPEC-0026`
See Q7. Build: Ant. Runtime: servlet container (Tomcat per `start-tomcat.sh`).

**Q27 — Data entities & relationships** · `SPEC-0027`
81 Hibernate-mapped entities incl. Product/Category, Order/OrderProduct, Customer, MerchantStore, CreditCard, Currency/Country/GeoZone, Tax. Source: `sm-core/conf/hibernate/*.hbm.xml`.

**Q28 — Architecture vs performance** · `SPEC-0028`
OSCache caching + reference-table preloading (`ReferenceLoaderServlet load-on-startup`). No async/queueing. Source: `web.xml:5-19`; `oscache.properties`.

**Q29 — Security in architecture** · `SPEC-0029`
Servlet filter auth (`CustomAuthFilter`), role-based access, encryption utilities. Centralized in sm-core security package. Source: `sm-central/.../web.xml:11-19`.

**Q30 — Deployment & updates** · `SPEC-0030`
Manual: Ant build → WARs → drop into container `webapps`. DB schema/upgrade scripts under `schema/upgrade`. Source: `README.md:97-99`; `schema/upgrade`.

**Q31 — Main design patterns** · `SPEC-0031`
MVC (Struts2 actions), DI (Spring), DAO/Repository, Service layer, Factory (integration factories), Module/Strategy (pluggable payment/shipping), VO/DTO (`GatewayTransactionVO`). Source: source tree.

**Q32 — Key design principles** · `SPEC-0032`
Separation of concerns (core vs web), pluggable integration modules, externalized config (properties/XML). Source: `sm-modules.xml`, build structure.

**Q33 — Source code organization** · `SPEC-0033`
Package-by-layer/feature under `com.salesmanager.core` (entity, service, module, util, security, constants); web apps under `com.salesmanager.central` / storefront packages. Source: source tree.

**Q34 — Error/exception handling** · `SPEC-0034`
Checked exceptions (`ServiceException`, `CreditCardUtilException`); integration errors persisted (`CentralIntegrationError.hbm.xml`). No global handler in legacy Struts layer. Source: `sm-core/.../exception/`, hibernate mapping.

**Q35 — Logging & tracing** · `SPEC-0035`
log4j (`log4j.properties`); SLF4J usage in some classes. No distributed tracing. Source: `sm-core/conf/properties/log4j.properties`.

**Q36 — Testing strategy** · `SPEC-0036`
**No automated tests detected** in legacy source (no test roots / JUnit config). Flagged for Stage 2 golden-master (`quality-assurance`). Source: repo scan (gap G4 in `app-inventory.md`).

---

## C. Data & APIs (Q37–Q46)

**Q37 — Database technology** · `SPEC-0037`
Relational SQL: HSQLDB (default/in-memory test), MySQL, Oracle. Source: `README.md:27-35`; `schema/shopizer-build-*`.

**Q38 — Data flow within app** · `SPEC-0038`
See Q25; ORM-mediated CRUD; reference data cached at startup. Source: `web.xml`, Hibernate config.

**Q39 — Data at rest / in transit** · `SPEC-0039`
At rest: `EncryptionUtil` for sensitive fields (credit card). In transit: HTTPS `transport-guarantee` blocks present but **commented out** → likely plain HTTP by default. Source: `EncryptionUtil.java`; `web.xml:71-86`,`109-134`. **Gap flagged.**

**Q40 — Backup & recovery** · `SPEC-0040`
**UNKNOWN** — no backup/recovery scripts or docs in repo (DB-vendor responsibility).

**Q41 — Integration architecture & endpoints** · `SPEC-0041`
SOAP web services via JAX-WS: `/salesManagerCustomerService`, `/salesManagerInvoiceService`; outbound HTTP to payment/shipping gateways (`HttpCallUtil`). Source: `sm-central/.../web.xml:54-68`.

**Q42 — API standards** · `SPEC-0042`
SOAP / JAX-WS (WSDL). No REST in local v1.1.5 (REST exists only in upstream fork — flagged). Source: `web.xml`; corpus-catalog discrepancy note.

**Q43 — API documentation** · `SPEC-0043`
WSDL auto-published by JAX-WS endpoints; Javadoc target in `sm-core/build.xml:86-104`. No OpenAPI. Source: `sm-core/build.xml:86-104`.

**Q44 — API security** · `SPEC-0044`
Web-service auth **UNKNOWN/limited** (no explicit WS-Security config found); admin actions behind `CustomAuthFilter`. Source: `web.xml`. **Flagged for security-analyst.**

**Q45 — API versioning** · `SPEC-0045`
**UNKNOWN** — no API versioning scheme found.

**Q46 — API performance & monitoring** · `SPEC-0046`
**UNKNOWN** — no API monitoring config in repo.

---

## D. Operations & monitoring (Q47–Q51, Q53)

**Q47 — Monitoring tools & metrics** · `SPEC-0047`
**UNKNOWN** — only log4j logging; no APM/metrics.

**Q48 — Alerting & escalation** · `SPEC-0048`
**UNKNOWN** — none in repo.

**Q49 — Logging strategy & retention** · `SPEC-0049`
log4j appenders (`log4j.properties`); retention policy **UNKNOWN**. Source: `sm-core/conf/properties/log4j.properties`.

**Q50 — Log analysis / troubleshooting** · `SPEC-0050`
Manual log inspection (`tail -f tomcat/logs/catalina.out` per `start-tomcat.sh:24`). No centralized log analysis.

**Q51 — Incident management process** · `SPEC-0051`
**UNKNOWN** — not documented in repo.

> **Q52 — (absent in source questionnaire; numbering skips 52)** — flagged, no question text.

**Q53 — Disaster recovery plan** · `SPEC-0053`
**UNKNOWN** — no DR plan in repo.

---

## E. Security & compliance (Q54–Q59)

**Q54 — AuthN / AuthZ system** · `SPEC-0054`
Custom servlet-filter authentication (`com.salesmanager.core.security.CustomAuthFilter`) on `*.action`; role-based authorization (e.g., role `PRODUCTS`). Source: `sm-central/.../web.xml:11-19`.

**Q55 — Roles & permissions** · `SPEC-0055`
DB-backed roles/groups: `MerchantUserRole`, `MerchantUserRoleDef`, `CentralGroup`, `CentralFunction`. Source: `sm-core/conf/hibernate/MerchantUserRole*.hbm.xml`, `CentralGroup.hbm.xml`.

**Q56 — Sensitive-data protection** · `SPEC-0056`
`EncryptionUtil` + `CreditCardUtil` for card handling; `CentralCreditCard` entity. Adequacy unverified → **flagged** (PCI). Source: `sm-core/.../util/{EncryptionUtil,CreditCardUtil}.java`.

**Q57 — Security logging & protection** · `SPEC-0057`
**UNKNOWN/limited** — no dedicated security audit log found; general log4j only.

**Q58 — Applicable compliance regulations** · `REQ-0058`
PCI-DSS (card data) and GDPR (PII) are applicable (26 PII + 16 FINANCIAL + 4 CREDENTIALS detections). No compliance artifacts in repo. Source: `docs/📊 Aggregate Scan Summary Report.md`. **Stage 3 scope.**

**Q59 — Security audit processes** · `SPEC-0059`
External scan exists (Aggregate Scan Summary, CAST audit). No in-app audit process. Source: `docs/📊 Aggregate Scan Summary Report.md`, `docs/Application Architecture (CAST -powered)/`.

---

## F. Performance & scaling (Q60–Q64)

**Q60 — Load testing & results** · `SPEC-0060`
**UNKNOWN** — no load-test artifacts.

**Q61 — Bottleneck identification/resolution** · `SPEC-0061`
**UNKNOWN**; CAST audit may note hotspots (Stage 2). JVM tuning hints only (`README.md:110-116`).

**Q62 — Optimization techniques** · `SPEC-0062`
OSCache caching; startup reference-data preload. No queueing. Source: `oscache.properties`, `web.xml`.

**Q63 — Scaling design (horizontal/vertical)** · `SPEC-0063`
Vertical (JVM heap/PermGen tuning). Horizontal limited by in-VM session/cache state — **flagged**. Source: `start-tomcat.sh:12`, `README.md:110-116`.

**Q64 — Production monitoring tools/metrics** · `SPEC-0064`
**UNKNOWN** — none in repo.

---

## G. Versioning & evolution (Q65–Q70)

**Q65 — Versioning strategy** · `SPEC-0065`
Marketing version 1.1.5 (looks SemVer-like); no formal policy documented. Source: `README.md:1`.

**Q66 — Version documentation/communication** · `SPEC-0066`
README + `schema/upgrade` scripts; `docs/`. No CHANGELOG found — **flagged**. Source: `schema/upgrade`, `docs/`.

**Q67 — Update/patch deployment** · `SPEC-0067`
Rebuild WARs (Ant) + run DB upgrade scripts; manual redeploy. Source: `README.md:97-99`, `schema/upgrade`.

**Q68 — Backward compatibility** · `SPEC-0068`
DB upgrade scripts imply forward migrations; explicit BC policy **UNKNOWN**. Source: `schema/upgrade`.

**Q69 — Roadmap** · `REQ-0069`
**UNKNOWN** for legacy app. Modernization roadmap is the output of this pipeline (Stage 4). 

**Q70 — Obsolescence elimination strategy** · `SPEC-0070`
None in legacy app. Obsolete stack (JDK 1.5, Struts 2, Ant, JAX-WS) → addressed by `software-debt-analyst` (Stage 2) + `coding-framework` (Stage 3). Source: `README.md:17-22`.

---

## Completion summary

- **Questions answered:** 69/69 listed (source set skips #52; gap preserved & flagged).
- **Concrete answers:** 47 · **UNKNOWN/flagged:** 22 (operations, monitoring, DR, KPIs, some security/API details — no evidence in repo; not fabricated).
- **Traceability:** REQ-0001…REQ-0069 (business/functional) and SPEC-0007…SPEC-0070 (technical) seeded in `00-twin/traceability-matrix.md`.
- **Module coverage:** all 4 modules covered (`module-map.json`).
