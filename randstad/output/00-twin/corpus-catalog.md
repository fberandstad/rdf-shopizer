# Corpus Catalog — Digital Twin Index

**Owner:** `context-indexer`  **Stage:** 1 (Context Discovery)  **Generated:** 2026-06-06
**Graph backend:** `memory` MCP server  **Indexing policy:** redacted content only (see `redaction-log.md`)

> This catalog enumerates every corpus source indexed into the Digital Twin during
> Stage 1, with type, scope, and indexing status. Legacy source under `sm-core/`,
> `sm-central/`, `sm-shop/`, `schema/` is **read-only**. All entries pass
> `pii-redaction-filter` before indexing.

## 1. Source code corpora

| Source | Type | Size / Count | Indexed | Notes |
|--------|------|--------------|---------|-------|
| `sm-core/src/**` | Java library | 479 `.java` files | yes | Entities, services, integration modules |
| `sm-central/src/**` | Java (admin web) | 132 `.java`, 141 `.jsp` | yes | Struts2 admin actions + JSP views |
| `sm-shop/src/**` | Java (storefront) | 66 `.java`, 127 `.jsp` | yes | Struts2 storefront actions + JSP views |
| `sm-core/conf/hibernate/*.hbm.xml` | ORM mapping | 81 mappings | yes | Domain entity → table mappings |
| `sm-core/conf/spring/*.xml` | Spring config | 5 files | yes | DI beans, workflow beans, modules |
| `sm-core/conf/properties/*` | Config | 6 files | partial | `systems.properties` / `sm-core-config.properties` deferred — credentials hotspot (see redaction-log) |
| `schema/**` | DB schema/scripts | 26 items | yes | HSQLDB/MySQL/Oracle DDL + upgrades |
| `*/conf/struts/struts.xml`, `*/WebContent/WEB-INF/web.xml` | Web config | 4+2 files | yes | Front controllers, filters, servlets |
| `*/build.xml`, `rebuild-all.sh`, `start-tomcat.sh` | Build/run | 4+2 | yes | Ant builds, JDK 1.5 runtime |

## 2. Documentation corpora

| Source | Type | Indexed | Notes |
|--------|------|---------|-------|
| `README.md`, `OVERVIEW.md` | Overview | yes | Authoritative for version, stack, build |
| `docs/Application Discovery (AI-powered).md` | Questionnaire | yes | 70-question discovery set (numbering skips #52) |
| `docs/Application Architecture (CAST -powered)/**` | Architecture | yes | CAST audit, transaction traces |
| `docs/Application Discovery (AI-powered)/**` | Discovery notes | yes | AppExpert memory (276KB, chunked), Source Code Understanding |
| `docs/📊 Aggregate Scan Summary Report.md` | Security scan | yes | 46 detections; drives redaction-log |
| `docs/specifications.md`, `docs/questionnaire.md`, `docs/Existing application.md` | Specs | yes | Supplementary ground truth |
| `docs/Retro-documentation (AI-Powered).md` | Doc template | yes | Used by documentation-traceability |
| `docs/**/*.png` (7) + UI screenshots | Images | catalog-only | OCR deferred; admin*.png flagged in scan report |

## 3. Indexing notes & gaps

- **Upstream vs local discrepancy (flagged):** `docs/Application Discovery (AI-powered)/Source Code Understanding.md` describes a Spring-MVC `@Controller` (`FilesController`) from the modern upstream fork `github.com/fbeawels/shopizer`. The **local v1.1.5** code is Struts 2 (no Spring MVC controllers). Ground-truth claims in Stage 1 artifacts are based on the **local** source; upstream docs are treated as secondary.
- **Dependency JARs not in repo:** `*/lib/**` contains only `readme.txt`/license stubs; binary `.jar` files are gitignored. Library versions are inferred from build classpath groupings (struts, spring, hibernate, axis, jax-ws, misc) and license files (e.g., `groovy-all-1.5.5`). Exact versions flagged as partial-unknown in `discovery-answers.md`.
- **Deferred for redaction:** property files with DB/SMTP credentials and the payment/credit-card hotspots are indexed only after redaction; raw secret values are never embedded into the Twin.

## 4. Retrieval contract

- Entities and relations are persisted in the `memory` graph (see Twin entities: `Shopizer v1.1.5`, `sm-core`, `sm-central`, `sm-shop`, `schema`, framework + integration nodes).
- Downstream agents retrieve via `memory.search_nodes` / `memory.open_nodes`.
- Re-index trigger: any change under `randstad/output/**` or legacy source mtime change.
