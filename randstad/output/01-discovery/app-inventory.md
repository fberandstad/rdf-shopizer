# Application Inventory — Shopizer v1.1.5

**Owner:** `appmod-analyst`  **Stage:** 1 (Context Discovery)  **Generated:** 2026-06-06
**Status:** ground truth, source-cited  **Gate:** stage-1-approval

> Every claim cites a local `file:line` or document. Where evidence is unavailable,
> the item is flagged **UNKNOWN** rather than fabricated. Legacy source is read-only.

## 1. Identity

| Attribute | Value | Evidence |
|-----------|-------|----------|
| Name | Shopizer | `README.md:1`, `OVERVIEW.md:1` |
| Version | 1.1.5 | `README.md:1` |
| Release date | 2011-08-14 | `README.md:3` |
| License | GNU LGPL v3 | `OVERVIEW.md:9`, `SHOPIZER-LIC` |
| Domain | Online sales / e-commerce (catalog, cart, order, invoicing) | `README.md:7-11` |
| Base Java package | `com.salesmanager` | `sm-shop/.../web.xml:9`, source tree |

## 2. Module inventory (4 modules)

| Module | Type | Artifact | Java | JSP | Depends on | Evidence |
|--------|------|----------|------|-----|------------|----------|
| `sm-core` | Library | `sm-core.jar` | 479 | 0 | — | `sm-core/build.xml:10-17` |
| `sm-central` | Admin web app | `sm-central.war` | 132 | 141 | `sm-core` | `sm-central/.../web.xml`, `README.md:86` |
| `sm-shop` | Storefront web app | `shop.war` | 66 | 127 | `sm-core` | `sm-shop/build.xml:62-65` |
| `schema` | DB schema/scripts | SQL | — | — | — | `schema/`, `README.md:27-35` |

A separate `media` web app (`media.war`) hosts media files per `README.md:13` (not present as a module dir in this checkout — **flagged**).

## 3. Technology stack

| Layer | Technology | Evidence |
|-------|-----------|----------|
| Language / runtime | Java, JDK 1.5+ | `README.md:21-22`, `rebuild-all.sh:3-6` |
| Build | Apache Ant 1.6+ | `README.md:17-18`, `*/build.xml` |
| Web MVC | Struts 2 (`StrutsPrepareAndExecuteFilter`) | `sm-shop/.../web.xml:22-34`, `sm-central/.../web.xml:21-37` |
| Templating | Apache Tiles (`StrutsTilesListener`) | `web.xml` (both apps) |
| AJAX | DWR (`DWRServlet` → `/dwr/*`) | `web.xml` (both apps) |
| DI / config | Spring Framework | `sm-core/conf/spring/*.xml` |
| Persistence | Hibernate (81 `.hbm.xml`) | `sm-core/conf/hibernate/*.hbm.xml` |
| Web services | JAX-WS (Sun Metro `WSServlet`), Axis libs | `sm-central/.../web.xml:48-68` |
| Caching | OSCache | `sm-core/conf/properties/oscache.properties` |
| Logging | log4j | `sm-core/conf/properties/log4j.properties` |
| Reporting | JasperReports, Groovy 1.5.5 | `sm-core/lib/misc/*-LICENSE.txt` |
| Databases | HSQLDB (default/test), MySQL, Oracle | `README.md:27-35`, `schema/` |

**Dependency versions:** exact JAR versions are **partially UNKNOWN** — `lib/**` holds only readme/license stubs; binaries are gitignored. Inferred groupings: `struts`, `spring`, `hibernate`, `axis`, `jax-ws`, `misc`. (`sm-core/build.xml:21-45`)

## 4. Integration inventory

| Category | Providers | Evidence |
|----------|-----------|----------|
| Payment (9) | Paypal, BeanStream, AuthorizeNet, Moneris, Psigate, CreditCardGateway, COD, MoneyOrder, Free | `sm-core/.../module/impl/integration/payment/` |
| Shipping (7+) | CanadaPost, UPS, USPS, Fedex (Express/Ground/Request/Stub) | `sm-core/.../module/impl/integration/shipping/` |
| Social | Facebook | `sm-core/.../util/www/integration/fb/FacebookIntegrationFactory.java` |
| Email | SMTP / Gmail | `README.md:76-77`, `EmailUtil.java` |
| Captcha | SimpleCaptcha | `sm-core/.../module/impl/application/utils/SimpleCaptchaModule.java` |
| SOAP services | Customer service, Invoice service | `sm-central/.../web.xml:54-68` |

## 5. Security & sensitive-data hotspots (per scan report)

| Hotspot | Category | Evidence |
|---------|----------|----------|
| `CreditCardUtil.java` | FINANCIAL (14 detections) | scan report; `sm-core/.../util/CreditCardUtil.java` |
| `BeanStreamTransactionImpl.java` | CREDENTIALS/FINANCIAL | scan report; payment module |
| `PaypalTransactionImpl.java` | CREDENTIALS | scan report; payment module |
| `EncryptionUtil.java` | CREDENTIALS | scan report; `sm-core/.../util/EncryptionUtil.java` |
| `systems.properties` | CREDENTIALS (DB/SMTP) | `README.md:63-77` |
| Admin auth | `CustomAuthFilter` on `*.action` | `sm-central/.../web.xml:11-19` |

Full handling tracked in `00-twin/redaction-log.md`.

## 6. Build & run

- Build: per-module Ant (`ant` in each module) or `rebuild-all.sh` (sets JDK 1.5 + Ant). (`README.md:37-95`, `rebuild-all.sh`)
- Run: deploy WARs to a servlet container; `start-tomcat.sh` runs bundled Tomcat (JDK 1.5, `-Xms256m -Xmx256m -XX:MaxPermSize=128m`).
- URLs: storefront `/shop`, admin `/central` (`README.md:101-104`; `start-tomcat.sh:26-27`).

## 7. Known gaps / flags

- **G1** Dependency JAR versions partially UNKNOWN (binaries gitignored).
- **G2** `media` web app referenced in docs but absent from this checkout.
- **G3** Upstream fork docs describe Spring-MVC controllers; local v1.1.5 is Struts 2 — local source is authoritative.
- **G4** No automated test suite detected in legacy source (no `test/` source roots, no JUnit config found) — **flagged** for QA (Stage 2 golden master).
