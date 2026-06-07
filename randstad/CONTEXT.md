# Repository Context

## Purpose

This repository (`fberandstad/rdf-shopizer`) is an **agentic retro-engineering
platform** built around a legacy application. The application source code is used
as the subject ("Application Twin") that AI agents explore, document, analyze and
modernize. The goal is to demonstrate AI-powered reverse engineering: tying code
back to requirements, recovering documentation, surfacing quality/security issues,
and recommending modern best practices.

## Subject Application: Shopizer v1.1.5

- **What:** A Java-based online sales management platform (e-commerce).
- **Release date:** 2011-08-14 (legacy codebase).
- **Capabilities:** Online catalogue, shopping cart, order fulfillment, online invoicing.
- **License:** GNU Lesser General Public License (LGPL) v3.
- **Upstream source:** https://github.com/fbeawels/shopizer_v1/

### Architecture (multi-module)

| Module        | Role                                          |
|---------------|-----------------------------------------------|
| `sm-core`     | Core business logic and entity definitions    |
| `sm-central`  | Administrative web application (admin console) |
| `sm-shop`     | Customer-facing storefront web application     |
| `schema`      | Database schema and setup scripts              |

A separate `media` web app (built into a WAR) hosts media files.

### Technology Stack

- **Frameworks:** Struts 2, Spring, Hibernate (ORM), Apache Tiles, JAX-WS.
- **Build:** Apache Ant (per-module build scripts).
- **Runtime:** JDK 1.5+, servlet container (Tomcat).
- **Databases:** MySQL (recommended), Oracle, HSQLDB (dev/test, in-memory preconfigured).

### Build & Run (local)

- `rebuild-all.sh` — builds `sm-core`, `sm-central`, `sm-shop` using a bundled
  JDK 1.5 and Ant (`./jdk`, `./ant`), producing WARs in `dist/`.
- `start-tomcat.sh` — starts the bundled Tomcat (`./tomcat`) with legacy JVM
  options (`-Xms256m -Xmx256m -XX:MaxPermSize=128m`).
- Access URLs (local): Shop at `/shop/`, Admin (Central) at `/central/`.

## Agentic Platform Layer

The legacy app is wrapped by an agentic tooling layer documented under `docs/`:

- **Application Discovery (AI-powered):** A ~70-question discovery questionnaire
  covering business context, architecture, data, security, performance, API,
  operations, compliance and roadmap (`docs/Application Discovery (AI-powered).md`).
- **Retro-documentation (AI-powered):** Regenerates structured documentation —
  Application Overview, High Level Design, Detailed Design, Technical Architecture
  (`docs/Retro-documentation (AI-Powered).md`).
- **Application Architecture (CAST-powered):** Uses CAST Imaging tools, organized
  into 6 categories — Application Overview, Transaction Overview, Data Graph
  Analysis, Code Quality & Security, Code Object & Source Analysis, Database
  Explorer (`docs/Application Architecture (CAST -powered).md`).
- **CAST Integration:** Ties code back to requirements, recommends modern best
  practices, supports reverse/forward engineering, and is "AI Code Agents
  Integration Ready" (`docs/Cast Integration.md`).
- **Interaction surfaces:**
  - *Conversational AI* — dialog with agents via the Awels platform (or Teams,
    Google, WhatsApp) (`docs/Use with Conversational AI.md`).
  - *VS Code IDE* — dialog with the Shopizer Application Twin via the Cline plugin
    (`docs/Use with VS Code IDE.md`).
- **Specifications & questionnaire:** `docs/specifications.md` and
  `docs/questionnaire.md` capture the recovered specs and discovery answers.

## Security / Sensitive Data Scanning

A sensitive-data scan (`docs/📊 Aggregate Scan Summary Report.md`) was run across
the codebase:

- 1,282 files scanned, 46 detections across 23 files.
- Categories: PII (26), FINANCIAL (16), CREDENTIALS (4).
- Scanners: Presidio and LLMGuard.
- Notable hotspots: payment integrations (`BeanStreamTransactionImpl.java`,
  `PaypalTransactionImpl.java`), `CreditCardUtil.java`, `EncryptionUtil.java`.

## Repository Layout

```
shopizer/
├── OVERVIEW.md                 # Platform overview of Shopizer
├── README.md                   # Build & deployment instructions (v1.1.5)
├── SHOPIZER-LIC                # License (LGPL v3)
├── rebuild-all.sh              # Build all modules (bundled JDK 1.5 + Ant)
├── start-tomcat.sh             # Start bundled Tomcat
├── sm-core/                    # Core business logic & entities
├── sm-central/                 # Admin web application
├── sm-shop/                    # Storefront web application
├── schema/                     # DB schema & setup scripts
├── screenshots/                # UI screenshots
├── docs/                       # Agentic platform docs, specs, scan reports
└── randstad/                   # This context directory
```

## Notes

- The application code is **legacy (2011)** and intentionally preserved as the
  reverse-engineering subject; it is not meant to be modernized in place but
  understood, documented and analyzed by AI agents.
- Bundled `jdk/`, `ant/`, and `tomcat/` directories are expected at the repo root
  for the build/run scripts (typically git-ignored).
