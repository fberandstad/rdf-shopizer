# AGENTS — End-to-End AI Application Modernization Demo

This document specifies **every agent** to be created under `.windsurf/` to run an
end-to-end, agent-driven modernization of the legacy **Shopizer v1.1.5** application
(see `randstad/CONTEXT.md`). It is derived from the Randstad Digital agentic
modernization model:

- **Lifecycle (Image 1):** Reverse Engineering → Context Engineering → Agentic
  Engineering → AI Agent Integration (CI/CD + self-remediation).
- **Process (Image 2):** 4 stages — *Context gathering → Digital Twin → Detailed
  technical design → New application generation* — each gated by **HITL**.
- **Org model (Image 3):** 4 **Agentic Teams** orbiting a central **Digital Twin**
  (`RAG | SLM | Tools | Prompts | Filters | Pipeline`), each with named Agents + a Corpus.

---

## 1. Operating Model

### 1.1 The Digital Twin (shared core)

The Digital Twin is the unified knowledge substrate every agent reads from and
writes to. It is **not** an agent; it is the shared state and retrieval layer.

| Capability | Implementation |
|------------|----------------|
| **RAG**    | Vector + graph index over code, docs, wikis, specs, scan reports |
| **SLM**    | Small/foundation models for extraction, classification, generation |
| **Tools**  | MCP servers (see §5) — GitHub, Context7, DeepWiki, Brave, Fetch, Playwright, Memory |
| **Prompts**| Versioned prompt templates per agent (`.windsurf/prompts/`) |
| **Filters**| PII/secret redaction, scope guards, output validators |
| **Pipeline**| Orchestrated, stage-gated workflow with HITL checkpoints |

The Twin's persistent knowledge graph is backed by the **Memory** MCP server; the
contextual retrieval engine is owned by the **Context Indexer (RAG) agent** (§4.1).

### 1.2 Phases → Teams → Stages

| Phase (Image 1) | Stage (Image 2) | Agentic Team (Image 3) | Output |
|-----------------|-----------------|------------------------|--------|
| Reverse Eng.    | 1 — Context gathering | **Team #1 — Context Discovery** | Application inventory & ground truth |
| Reverse Eng.    | 2 — Digital Twin | **Team #2 — Reverse Engineering** | Functional/technical specs, tests, tech debt |
| Context Eng.    | 3 — Detailed technical design | **Team #3 — Transformation Target** | Target architecture, security/compliance baseline |
| Forward Eng.    | 4 — New app generation | **Team #4 — Code Generation** | Converted code, scaffolding, migration roadmap |

### 1.3 Human In The Loop (HITL)

A HITL validation gate sits **between every stage** (Image 2). No stage's outputs
are promoted to the Twin as "approved ground truth" until validated. This is
enforced by the **HITL Gatekeeper agent** (§4.3).

---

## 2. Agent Specification Schema

Every agent file in `.windsurf/agents/` MUST define:

- **ID** — stable kebab-case identifier (= filename).
- **Team / Phase / Stage** — placement in the model.
- **Mission** — one-sentence objective.
- **Inputs (Corpus)** — what it reads.
- **Outputs (Artifacts)** — what it produces (path + format).
- **Tools / MCP** — allowed MCP servers and native tools.
- **External repositories** — frameworks/security/data sources it may reach.
- **HITL** — checkpoints requiring human approval.
- **Guardrails** — scope limits, redaction, do-not-touch rules.
- **Done criteria** — measurable completion signals.

---

## 3. Core Agents (per Agentic Team)

### Team #1 — Context Discovery (`Découverte du contexte`)

#### 3.1 `appmod-analyst` — AppMod Analyst
- **Team/Phase/Stage:** Team #1 / Reverse Engineering / Stage 1.
- **Mission:** Build the high-level inventory and "ground truth" of the existing
  application from all available artifacts.
- **Inputs (Corpus):** Source code (`sm-core`, `sm-central`, `sm-shop`, `schema`),
  `README.md`, `OVERVIEW.md`, `docs/` wikis, `docs/questionnaire.md`,
  `docs/specifications.md`, interview notes.
- **Outputs:** `randstad/output/01-discovery/app-inventory.md`,
  `module-map.json`, answers to the 70-question discovery set
  (`docs/Application Discovery (AI-powered).md`).
- **Tools / MCP:** native file read/search, **Memory** (write inventory graph),
  **DeepWiki** (upstream repo docs), **Fetch**.
- **External repositories:** Upstream source `github.com/fbeawels/shopizer_v1`
  (via **GitHub** MCP / DeepWiki) for cross-checking original code.
- **HITL:** Inventory sign-off before Stage 2.
- **Guardrails:** Read-only on legacy code; never modifies the subject app.
- **Done:** All 70 discovery questions answered or flagged "unknown".

### Team #2 — Reverse Engineering (`Rétro-Ingénierie`)

#### 3.2 `software-architect` — Software Architect
- **Team/Phase/Stage:** Team #2 / Reverse Engineering / Stage 2.
- **Mission:** Reconstruct the as-is technical architecture, components,
  data flows, and integration points into the Digital Twin.
- **Inputs:** Discovery inventory, code, `schema/`, CAST architecture docs
  (`docs/Application Architecture (CAST -powered).md`).
- **Outputs:** `02-reverse/architecture-as-is.md`, component & dependency graphs,
  C4-style diagrams, `data-flows.md`.
- **Tools / MCP:** Memory (architecture graph), Context7 (Struts2/Spring/Hibernate
  reference), DeepWiki, native search.
- **External repositories:** Framework docs (Struts 2, Spring, Hibernate, Tiles,
  JAX-WS) via **Context7**.
- **HITL:** Architecture review.
- **Done:** Every module + external integration mapped with dependencies.

#### 3.3 `business-analyst` — Business Analyst
- **Mission:** Recover undocumented business logic, functional specs, business
  rules, and user stories from code and screens.
- **Inputs:** Code, screenshots (`screenshots/`), wikis, discovery output.
- **Outputs:** `02-reverse/functional-specifications.md`, `business-rules.md`,
  `user-stories.md`.
- **Tools / MCP:** Memory, native read, **Playwright** (replay/observe UI flows if
  the app is running), Fetch.
- **External repositories:** none required.
- **HITL:** Functional spec validation.
- **Done:** Each feature traced to source code + UI evidence (traceability IDs).

#### 3.4 `software-debt-analyst` — Software Debt
- **Mission:** Quantify technical debt, obsolescence, and modernization blockers.
- **Inputs:** Code, build scripts (`rebuild-all.sh`), dependency lists, CAST
  quality insights.
- **Outputs:** `02-reverse/tech-debt-report.md` (severity-ranked),
  `obsolescence-matrix.md` (e.g., JDK 1.5, Struts 2, Ant).
- **Tools / MCP:** Context7 (EOL/version data), **Brave Search** + **Fetch** (CVE,
  EOL dates), Memory, GitHub.
- **External repositories:** NVD/CVE feeds, endoflife.date, framework release notes.
- **HITL:** Debt prioritization review.
- **Done:** All third-party libs classified (keep / upgrade / replace / remove).

#### 3.5 `quality-assurance` — Quality Assurance
- **Mission:** Derive test cases that characterize current behavior (golden master)
  for regression-safe migration.
- **Inputs:** Functional specs, business rules, code paths, UI flows.
- **Outputs:** `02-reverse/test-cases.md`, `regression-suite/` (executable specs).
- **Tools / MCP:** **Playwright** (E2E capture against running shop/central),
  Memory, native read.
- **External repositories:** none.
- **HITL:** Test-coverage acceptance.
- **Done:** Critical user journeys (catalog, cart, checkout, admin) covered.

### Team #3 — Transformation Target (`Cible de Transformation`)

#### 3.6 `security-analyst` — Security Analyst
- **Team/Phase/Stage:** Team #3 / Context Engineering / Stage 3.
- **Mission:** Establish the security baseline and target controls; reconcile scan
  findings with target architecture.
- **Inputs:** `docs/📊 Aggregate Scan Summary Report.md`, code hotspots
  (`CreditCardUtil.java`, `EncryptionUtil.java`, payment integrations), architecture.
- **Outputs:** `03-target/security-baseline.md`, `threat-model.md`,
  `remediation-backlog.md`.
- **Tools / MCP:** **Brave Search** + **Fetch** (CVE/NVD, OWASP Top 10, CWE),
  **GitHub** (advisories), Memory.
- **External repositories (REQUIRED):** NVD CVE database, OWASP ASVS/Top 10,
  GitHub Security Advisories, CWE.
- **HITL:** Security baseline approval.
- **Done:** Every scan detection mapped to a target control or accepted risk.

#### 3.7 `compliance-analyst` — Compliance Analyst
- **Mission:** Map regulatory obligations (GDPR, PCI-DSS for payments/credit cards)
  to data handling in the target design.
- **Inputs:** Data inventory, PII/financial scan detections, business context.
- **Outputs:** `03-target/compliance-matrix.md`, `data-protection-requirements.md`.
- **Tools / MCP:** **Fetch** + **Brave Search** (regulatory texts), Memory.
- **External repositories (REQUIRED):** GDPR text, PCI-DSS guidance.
- **HITL:** Compliance sign-off.
- **Done:** All PII/financial data flows have a documented lawful basis + control.

#### 3.8 `coding-framework` — Coding Framework
- **Mission:** Define the **target** technology stack, reference architecture,
  coding standards, and conversion patterns (e.g., Struts 2 → Spring Boot/REST,
  Ant → Maven/Gradle, JSP → modern frontend).
- **Inputs:** As-is architecture, tech-debt report, NFRs.
- **Outputs:** `03-target/target-architecture.md`, `coding-standards.md`,
  `conversion-patterns.md`, `api-specifications.md` (OpenAPI).
- **Tools / MCP:** **Context7** (target framework docs), **DeepWiki** + **GitHub**
  (reference implementations / starter repos), Memory.
- **External repositories (REQUIRED):** Target framework docs & starters
  (e.g., `spring-projects/spring-boot`), build-tool docs.
- **HITL:** Target architecture decision review (ADR).
- **Done:** Documented 1:1 mapping from each legacy pattern to a target pattern.

### Team #4 — Code Generation (`Génération du code`)

#### 3.9 `project-scaffolding` — Project Scaffolding
- **Team/Phase/Stage:** Team #4 / Forward Engineering / Stage 4.
- **Mission:** Generate the modern project skeleton and convert code module-by-module
  per the target architecture, preserving behavior verified by QA tests.
- **Inputs:** Target architecture, conversion patterns, API specs, regression suite.
- **Outputs:** `04-forward/converted/` (new codebase), build config (Maven/Gradle),
  CI/CD pipeline definitions.
- **Tools / MCP:** **GitHub** (create repo/branches, push files, PRs), **Context7**
  (framework APIs), Memory, native edit.
- **External repositories (REQUIRED):** Target framework + dependency registries;
  a destination GitHub repository for the modernized app.
- **HITL:** PR review per migration wave.
- **Done:** Module compiles, regression tests pass, PR approved.

#### 3.10 `tech-debt-manager` — Tech Debt Manager
- **Mission:** Plan the migration waves, sequence deliveries, and track residual
  debt during conversion.
- **Inputs:** Tech-debt report, dependency graph, target architecture.
- **Outputs:** `04-forward/migration-roadmap.md`, `wave-planning.md`,
  `nfr-checklist.md`.
- **Tools / MCP:** **GitHub** (issues/milestones/sub-issues), Memory.
- **External repositories:** destination GitHub repo (project management).
- **HITL:** Roadmap / wave approval.
- **Done:** Every module assigned to a wave with dependencies respected.

---

## 4. Cross-Cutting Agents (added — required, missing from the diagrams)

These are necessary to actually **execute** the pipeline end to end and implement
the accelerators (Image 2) and the AI-Agent-Integration phase (Image 1).

#### 4.1 `context-indexer` — RAG / Context Engine
- **Mission:** Build and maintain the vector + graph index that powers the Digital
  Twin; chunk, embed, and link all corpora; serve retrieval to every agent.
- **Inputs:** All repository artifacts and generated outputs.
- **Outputs:** Index manifests, retrieval API contract, `corpus-catalog.md`.
- **Tools / MCP:** **Memory** (graph), native read/search, Fetch.
- **HITL:** none (infrastructure); audited.
- **Done:** All corpora indexed; staleness < defined threshold.

#### 4.2 `orchestrator` — Conductor / Pipeline Orchestrator
- **Mission:** Drive the staged pipeline (LangGraph/CrewAI-style), dispatch tasks to
  team agents, manage state, enforce stage gates, and handle retries.
- **Inputs:** Stage definitions, agent registry, Twin state.
- **Outputs:** `run-state/` logs, stage transition records, `pipeline.md`.
- **Tools / MCP:** all (delegation), Memory.
- **HITL:** Triggers HITL Gatekeeper at each gate.
- **Done:** Pipeline reaches Stage 4 with all gates passed.

#### 4.3 `hitl-gatekeeper` — Human-In-The-Loop Validation
- **Mission:** Package each stage's outputs for human review and block promotion
  until explicit approval (conversational validation AI accelerator).
- **Inputs:** Stage artifacts.
- **Outputs:** `approvals/<stage>.md` (decision, reviewer, timestamp, comments).
- **Tools / MCP:** **Memory**, `ask_user_question` (native), Fetch.
- **HITL:** This agent *is* the HITL interface.
- **Done:** Signed approval recorded for the stage.

#### 4.4 `pii-redaction-filter` — Sensitive Data Filter
- **Mission:** Enforce the Twin's "Filters": redact PII/secrets/financial data from
  any artifact before indexing or external tool calls (Presidio/LLMGuard-style).
- **Inputs:** Any artifact in/out of the Twin; `docs/📊 Aggregate Scan Summary Report.md`.
- **Outputs:** `redaction-log.md`, sanitized artifacts.
- **Tools / MCP:** **GitHub** secret scanning, native, Memory.
- **HITL:** Escalation on new high-confidence detections.
- **Done:** Zero un-redacted secrets leave the workspace.

#### 4.5 `test-generation` — Forward Test Generator
- **Mission:** Generate target-stack automated tests (unit + integration + E2E) from
  detailed specs and the legacy golden-master suite; ensure traceability.
- **Inputs:** Detailed design (Stage 3), regression suite (Stage 2), converted code.
- **Outputs:** `04-forward/tests/`, coverage report.
- **Tools / MCP:** **Playwright** (E2E), **Context7** (test frameworks), GitHub, Memory.
- **HITL:** Coverage gate before merge.
- **Done:** Target tests green and mapped to legacy behavior IDs.

#### 4.6 `cicd-integration` — CI/CD & Self-Remediation
- **Mission:** Implement the AI-Agent-Integration phase — wire CI/CD pipelines, run
  automated tests in real time, and perform auto-remediation on failures.
- **Inputs:** Converted code, tests, pipeline definitions.
- **Outputs:** `.github/workflows/` (or equivalent), remediation playbooks, run logs.
- **Tools / MCP:** **GitHub** (Actions, PR checks, status), Fetch, Memory.
- **HITL:** Approves auto-remediation policy; production changes gated.
- **Done:** Pipeline builds, tests, and self-heals on transient failures.

#### 4.7 `documentation-traceability` — Docs & Traceability
- **Mission:** Maintain end-to-end traceability (requirement → spec → code → test)
  and regenerate the retro-documentation set with "full traceability" (Image 1).
- **Inputs:** All stage outputs.
- **Outputs:** `traceability-matrix.md`, regenerated docs aligned to
  `docs/Retro-documentation (AI-Powered).md` structure.
- **Tools / MCP:** Memory, native read/write.
- **HITL:** Final documentation review.
- **Done:** Every target artifact links back to a legacy requirement.

---

## 5. MCP Servers → Agent Mapping

| MCP Server | Primary purpose | Used by |
|------------|-----------------|---------|
| **Memory** | Digital Twin knowledge graph | all agents |
| **Context7** | Up-to-date framework/library docs | architect, coding-framework, scaffolding, test-gen, software-debt |
| **GitHub** | Repos, PRs, issues, advisories, secret scan | appmod-analyst, scaffolding, tech-debt-mgr, cicd, security, pii-filter |
| **DeepWiki** | Repo-level documentation Q&A | appmod-analyst, architect, coding-framework |
| **Brave Search** | CVE/EOL/regulatory/OWASP discovery | software-debt, security, compliance |
| **Fetch** | Retrieve external pages (standards, advisories) | software-debt, security, compliance, context-indexer |
| **Playwright** | Dynamic discovery + E2E tests | business-analyst, quality-assurance, test-generation |

## 6. External Repositories / Data Sources

- **Upstream legacy source:** `github.com/fbeawels/shopizer_v1` (cross-reference).
- **Framework references (Context7/DeepWiki):** Struts 2, Spring/Spring Boot,
  Hibernate, Apache Tiles, JAX-WS, build tools (Ant→Maven/Gradle).
- **Security data:** NVD/CVE, GitHub Security Advisories, OWASP Top 10/ASVS, CWE.
- **Compliance:** GDPR, PCI-DSS (payment/credit-card handling).
- **Destination repo:** new GitHub repository for the modernized application.

## 7. Proposed `.windsurf/` Layout

```
.windsurf/
├── agents/
│   ├── appmod-analyst.md
│   ├── software-architect.md
│   ├── business-analyst.md
│   ├── software-debt-analyst.md
│   ├── quality-assurance.md
│   ├── security-analyst.md
│   ├── compliance-analyst.md
│   ├── coding-framework.md
│   ├── project-scaffolding.md
│   ├── tech-debt-manager.md
│   ├── context-indexer.md
│   ├── orchestrator.md
│   ├── hitl-gatekeeper.md
│   ├── pii-redaction-filter.md
│   ├── test-generation.md
│   ├── cicd-integration.md
│   └── documentation-traceability.md
├── workflows/
│   ├── stage-1-context-discovery.md
│   ├── stage-2-digital-twin.md
│   ├── stage-3-target-design.md
│   ├── stage-4-code-generation.md
│   └── run-end-to-end.md
├── prompts/            # versioned prompt templates per agent
└── rules/
    ├── hitl-gates.md
    ├── data-redaction.md
    └── traceability.md
```

## 8. Agent Roster Summary

| # | Agent | Team | Stage | External repos |
|---|-------|------|-------|----------------|
| 1 | AppMod Analyst | #1 | 1 | upstream source |
| 2 | Software Architect | #2 | 2 | framework docs |
| 3 | Business Analyst | #2 | 2 | — |
| 4 | Software Debt | #2 | 2 | CVE/EOL |
| 5 | Quality Assurance | #2 | 2 | — |
| 6 | Security Analyst | #3 | 3 | NVD/OWASP/CWE |
| 7 | Compliance Analyst | #3 | 3 | GDPR/PCI-DSS |
| 8 | Coding Framework | #3 | 3 | target framework |
| 9 | Project Scaffolding | #4 | 4 | target framework + dest repo |
| 10 | Tech Debt Manager | #4 | 4 | dest repo |
| 11 | Context Indexer (RAG) | core | all | — |
| 12 | Orchestrator | core | all | — |
| 13 | HITL Gatekeeper | core | gates | — |
| 14 | PII/Redaction Filter | core | all | GitHub secret scan |
| 15 | Test Generation | #4 | 4 | test frameworks |
| 16 | CI/CD Integration | #4 | 4 | dest repo / Actions |
| 17 | Documentation & Traceability | core | all | — |

---

**Next step:** scaffold `.windsurf/agents/*.md` from this spec (one file per agent
using the schema in §2), then the stage workflows in `.windsurf/workflows/`.
