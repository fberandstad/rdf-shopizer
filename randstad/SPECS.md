# SPECS — `.windsurf/` Agent Implementation Specification

**Status:** Build-ready specification
**Source of truth:** `randstad/AGENTS.md` (catalog) + `randstad/CONTEXT.md` (subject app)
**Goal:** Define, exhaustively, every file to be created under `.windsurf/` so that
the end-to-end AI Application Modernization demo for **Shopizer v1.1.5** can be
executed by agents with Human-In-The-Loop (HITL) gates.

> `AGENTS.md` describes *what* agents exist and *why*. **This document describes
> *how* to build them**: exact file paths, formats, metadata schemas, full system
> prompts, tool bindings, data contracts, workflows, rules, and acceptance criteria.

---

## 1. Scope & Deliverables

This spec mandates the creation of the following artifacts:

- **17 agent definition files** — `.windsurf/agents/*.md`
- **5 workflow files** — `.windsurf/workflows/*.md`
- **3 rule files** — `.windsurf/rules/*.md`
- **17 prompt templates** — `.windsurf/prompts/*.md`
- **1 MCP configuration reference** — `.windsurf/mcp.config.md`
- **1 agent registry** — `.windsurf/registry.yaml`
- **Artifact output store** — `randstad/output/` (4 stage folders)

All paths are relative to the repository root
`/home/franck/Sandbox/03-Randstad/shopizer`.

---

## 2. Global Conventions

### 2.1 Naming

- **Agent ID:** kebab-case, equals filename without extension (e.g.,
  `software-architect` → `.windsurf/agents/software-architect.md`).
- **Artifact paths:** `randstad/output/<NN>-<stage>/<artifact>.<ext>`.
- **Traceability IDs:** `REQ-####`, `RULE-####`, `SPEC-####`, `TEST-####`,
  `RISK-####`, `DEBT-####`, `CVE-<id>`. Every generated artifact element carries one.

### 2.2 Output store layout

```
randstad/output/
├── 00-twin/            # shared knowledge: graph dumps, corpus catalog, glossary
├── 01-discovery/       # Stage 1 (Team #1)
├── 02-reverse/         # Stage 2 (Team #2)
├── 03-target/          # Stage 3 (Team #3)
├── 04-forward/         # Stage 4 (Team #4)
├── approvals/          # HITL decisions per stage
└── run-state/          # orchestrator logs & transitions
```

### 2.3 Determinism & safety defaults

- Legacy source under `sm-core/`, `sm-central/`, `sm-shop/`, `schema/` is **read-only**.
- All generated code/docs go to `randstad/output/` or a **separate destination repo**.
- Every external tool call is preceded by PII/secret redaction (see §6.2, agent 4.4).
- No stage is "approved" without a recorded HITL decision (see §7.1).

---

## 3. Agent File Format (mandatory schema)

Every `.windsurf/agents/<id>.md` MUST follow this structure: YAML frontmatter +
fixed markdown sections.

```markdown
---
id: <kebab-case-id>
name: <Human Readable Name>
team: <1|2|3|4|core>
phase: <reverse|context|forward|cross-cutting>
stage: <1|2|3|4|all|gates>
version: 1.0.0
activation: <manual|workflow|always>
model_profile: <reasoning|extraction|coding>
mcp_servers: [memory, context7, github, deepwiki, brave-search, fetch, playwright]
external_repositories: [<list or none>]
reads: [<corpus paths/globs>]
writes: [<artifact paths>]
depends_on: [<agent-ids>]
hitl_gate: <stage-N-approval | none>
---

## Mission
<one sentence>

## System Prompt
<full operating instructions for the agent>

## Inputs (Corpus)
<bullet list with exact paths>

## Outputs (Artifacts)
<bullet list: path — format — schema ref>

## Tools & MCP Bindings
<which tools, for what>

## External Repositories
<sources + access method>

## Procedure
<ordered steps the agent executes>

## HITL Checkpoints
<what is submitted, to whom, gate id>

## Guardrails
<scope limits, do-not-touch, redaction>

## Done Criteria
<measurable completion signals>

## Failure Modes & Recovery
<known failures + handling>
```

`activation` semantics: `manual` (invoked on demand), `workflow` (only via a stage
workflow), `always` (cross-cutting, runs every stage — e.g., redaction filter).

---

## 4. Agent Registry (`.windsurf/registry.yaml`)

A single machine-readable index the orchestrator loads. Required content:

```yaml
version: 1.0.0
twin:
  graph_backend: memory
  index_owner: context-indexer
stages:
  - id: 1
    name: context-discovery
    team: 1
    workflow: stage-1-context-discovery
    gate: stage-1-approval
  - id: 2
    name: reverse-engineering
    team: 2
    workflow: stage-2-digital-twin
    gate: stage-2-approval
  - id: 3
    name: transformation-target
    team: 3
    workflow: stage-3-target-design
    gate: stage-3-approval
  - id: 4
    name: code-generation
    team: 4
    workflow: stage-4-code-generation
    gate: stage-4-approval
agents:
  # one entry per agent: id, stage, depends_on, mcp_servers, external_repositories
  - { id: appmod-analyst,            stage: 1, depends_on: [context-indexer] }
  - { id: software-architect,        stage: 2, depends_on: [appmod-analyst] }
  - { id: business-analyst,          stage: 2, depends_on: [appmod-analyst] }
  - { id: software-debt-analyst,     stage: 2, depends_on: [appmod-analyst] }
  - { id: quality-assurance,         stage: 2, depends_on: [business-analyst] }
  - { id: security-analyst,          stage: 3, depends_on: [software-architect] }
  - { id: compliance-analyst,        stage: 3, depends_on: [business-analyst] }
  - { id: coding-framework,          stage: 3, depends_on: [software-architect, software-debt-analyst] }
  - { id: project-scaffolding,       stage: 4, depends_on: [coding-framework] }
  - { id: tech-debt-manager,         stage: 4, depends_on: [software-debt-analyst, coding-framework] }
  - { id: test-generation,           stage: 4, depends_on: [quality-assurance, coding-framework] }
  - { id: cicd-integration,          stage: 4, depends_on: [project-scaffolding, test-generation] }
  - { id: documentation-traceability, stage: all, depends_on: [] }
  - { id: context-indexer,           stage: all, depends_on: [] }
  - { id: orchestrator,              stage: all, depends_on: [] }
  - { id: hitl-gatekeeper,           stage: gates, depends_on: [] }
  - { id: pii-redaction-filter,      stage: all, depends_on: [] }
```

---

## 5. Shared Resources

### 5.1 MCP configuration (`.windsurf/mcp.config.md`)

Document required MCP servers, scopes, and per-agent allow-lists.

| Server | Scope | Notes |
|--------|-------|-------|
| `memory` | Digital Twin graph (entities, relations, observations) | all agents R/W |
| `context7` | Library/framework docs | resolve-library-id before get-library-docs |
| `github` | Repos, PRs, issues, advisories, secret scan | dest repo write requires token |
| `deepwiki` | Repo Q&A / wiki | upstream + framework repos |
| `brave-search` | Web/CVE/EOL/regulatory discovery | rate-limited |
| `fetch` | Retrieve standards/advisory pages as markdown | |
| `playwright` | Dynamic UI discovery + E2E | requires running app |

#### 5.1.1 Required MCP tools per agent

The `mcp_servers` frontmatter field grants a server; this table is the **explicit
allow-list of tool functions** each agent may call. Any tool not listed is denied.
Tool names use the `<server>.<tool>` convention.

| Agent | MCP tools (allow-list) |
|-------|------------------------|
| `appmod-analyst` | `memory.create_entities`, `memory.create_relations`, `memory.add_observations`, `memory.read_graph`, `memory.search_nodes`; `github.get_file_contents`, `github.search_code`, `github.list_commits`; `deepwiki.read_wiki_structure`, `deepwiki.read_wiki_contents`, `deepwiki.ask_question`; `fetch.fetch` |
| `software-architect` | `memory.create_entities`, `memory.create_relations`, `memory.add_observations`, `memory.read_graph`, `memory.open_nodes`; `context7.resolve-library-id`, `context7.get-library-docs`; `deepwiki.ask_question`, `deepwiki.read_wiki_contents` |
| `business-analyst` | `memory.create_entities`, `memory.create_relations`, `memory.add_observations`, `memory.search_nodes`; `playwright.browser_navigate`, `playwright.browser_snapshot`, `playwright.browser_click`, `playwright.browser_take_screenshot`; `fetch.fetch` |
| `software-debt-analyst` | `memory.create_entities`, `memory.add_observations`, `memory.read_graph`; `context7.resolve-library-id`, `context7.get-library-docs`; `brave-search.brave_web_search`; `fetch.fetch`; `github.list_releases`, `github.get_latest_release`, `github.search_code` |
| `quality-assurance` | `memory.create_entities`, `memory.add_observations`, `memory.search_nodes`; `playwright.browser_navigate`, `playwright.browser_snapshot`, `playwright.browser_click`, `playwright.browser_type`, `playwright.browser_fill_form`, `playwright.browser_evaluate`, `playwright.browser_console_messages`, `playwright.browser_network_requests` |
| `security-analyst` | `memory.create_entities`, `memory.create_relations`, `memory.add_observations`, `memory.read_graph`; `brave-search.brave_web_search`; `fetch.fetch`; `github.search_code`, `github.list_commits` (advisory/code cross-ref) |
| `compliance-analyst` | `memory.create_entities`, `memory.add_observations`, `memory.search_nodes`; `brave-search.brave_web_search`; `fetch.fetch` |
| `coding-framework` | `memory.create_entities`, `memory.create_relations`, `memory.add_observations`, `memory.read_graph`; `context7.resolve-library-id`, `context7.get-library-docs`; `deepwiki.read_wiki_structure`, `deepwiki.read_wiki_contents`, `deepwiki.ask_question`; `github.get_file_contents`, `github.search_repositories` |
| `project-scaffolding` | `memory.read_graph`, `memory.search_nodes`, `memory.add_observations`; `context7.resolve-library-id`, `context7.get-library-docs`; `github.create_repository`, `github.create_branch`, `github.create_or_update_file`, `github.push_files`, `github.create_pull_request`, `github.get_file_contents` |
| `tech-debt-manager` | `memory.read_graph`, `memory.add_observations`, `memory.create_relations`; `github.issue_write`, `github.sub_issue_write`, `github.search_issues`, `github.list_pull_requests` |
| `context-indexer` | `memory.create_entities`, `memory.create_relations`, `memory.add_observations`, `memory.read_graph`, `memory.search_nodes`, `memory.open_nodes`, `memory.delete_observations`; `fetch.fetch` |
| `orchestrator` | `memory.read_graph`, `memory.search_nodes`, `memory.add_observations`, `memory.create_relations` (delegation/state; dispatches other agents — no direct external writes) |
| `hitl-gatekeeper` | `memory.read_graph`, `memory.add_observations`; native `ask_user_question`; `fetch.fetch` |
| `pii-redaction-filter` | `memory.add_observations`, `memory.search_nodes`; `github.run_secret_scanning` |
| `test-generation` | `memory.read_graph`, `memory.add_observations`; `context7.resolve-library-id`, `context7.get-library-docs`; `playwright.browser_navigate`, `playwright.browser_snapshot`, `playwright.browser_click`, `playwright.browser_fill_form`, `playwright.browser_evaluate`; `github.create_or_update_file`, `github.push_files` |
| `cicd-integration` | `memory.add_observations`, `memory.read_graph`; `github.create_or_update_file`, `github.push_files`, `github.pull_request_read`, `github.merge_pull_request`, `github.create_branch`; `fetch.fetch` |
| `documentation-traceability` | `memory.read_graph`, `memory.search_nodes`, `memory.open_nodes`, `memory.create_relations`, `memory.add_observations` |

**Write-scope note:** `github` *write* tools (`create_repository`, `create_branch`,
`create_or_update_file`, `push_files`, `create_pull_request`, `merge_pull_request`,
`issue_write`, `sub_issue_write`) are restricted to the **destination repo** and
are **never auto-run** (HITL/manual per §7.1 and §8). `memory.delete_*` tools are
granted only to `context-indexer` for staleness pruning. All `fetch`/`brave-search`
calls are subject to PII redaction (§6.14, §7.2).

### 5.2 Prompt templates (`.windsurf/prompts/<id>.md`)

One per agent. Each prompt MUST include: role, objective, allowed tools, output
format contract, traceability-ID rules, redaction rule, and HITL handoff phrasing.
The **System Prompt** section in each agent file is the canonical copy; the
`prompts/` file is the externalized, versioned template the runtime loads.

### 5.3 Rules (`.windsurf/rules/`) — see §7.

---

## 6. Per-Agent Specifications

> Each subsection below is the authoritative content for the corresponding
> `.windsurf/agents/<id>.md`. Frontmatter fields not shown reuse defaults from §3.

### Team #1 — Context Discovery

#### 6.1 `appmod-analyst`
- **Frontmatter:** team 1, phase reverse, stage 1, activation workflow,
  model_profile extraction, mcp `[memory, github, deepwiki, fetch]`,
  external_repositories `[github.com/fbeawels/shopizer_v1]`, hitl_gate `stage-1-approval`.
- **System Prompt:** "You are the AppMod Analyst. Inventory the legacy Shopizer
  application exhaustively and produce verifiable ground truth. For every claim,
  cite the source file/line or document. Answer all 70 discovery questions; mark
  unknowns explicitly. Never modify legacy code. Write entities/relations to the
  Memory graph with stable IDs. Emit traceability IDs (REQ-/SPEC-) for each finding."
- **Reads:** `sm-core/**`, `sm-central/**`, `sm-shop/**`, `schema/**`, `README.md`,
  `OVERVIEW.md`, `docs/**`, `docs/questionnaire.md`, `docs/specifications.md`.
- **Writes:** `01-discovery/app-inventory.md`, `01-discovery/module-map.json`,
  `01-discovery/discovery-answers.md` (70 Q), `00-twin/glossary.md`.
- **Procedure:** index check → module enumeration → tech stack extraction →
  dependency capture → answer discovery set → write graph → submit to HITL.
- **Done:** 70/70 answered or flagged; module-map covers all 4 modules.
- **Failure modes:** missing source → log gap, do not fabricate.

### Team #2 — Reverse Engineering

#### 6.2 `software-architect`
- **Frontmatter:** team 2, stage 2, mcp `[memory, context7, deepwiki]`,
  external_repositories `[Struts2, Spring, Hibernate, Tiles, JAX-WS docs]`,
  hitl_gate `stage-2-approval`, depends_on `[appmod-analyst]`.
- **System Prompt:** "You are the Software Architect. Reconstruct the as-is
  architecture: layers, components, responsibilities, data flows, integrations.
  Produce C4 (context/container/component) and a dependency graph. Validate
  framework usage against Context7 references. Cite code for every component."
- **Writes:** `02-reverse/architecture-as-is.md`, `02-reverse/data-flows.md`,
  `02-reverse/dependency-graph.json`, C4 diagrams (`.md` + mermaid).
- **Done:** all modules + external integrations mapped; no orphan components.

#### 6.3 `business-analyst`
- **System Prompt:** "You are the Business Analyst. Recover functional behavior,
  business rules, and user stories from code, JSPs, Struts actions, and UI
  screenshots. Express rules as RULE-#### with conditions/actions. Map every user
  story to source evidence."
- **Reads:** code, `screenshots/**`, wikis, `01-discovery/**`.
- **Writes:** `02-reverse/functional-specifications.md`,
  `02-reverse/business-rules.md`, `02-reverse/user-stories.md`.
- **Tools:** Playwright (observe UI flows if app running), Memory.
- **Done:** every feature has source + UI evidence and a traceability ID.

#### 6.4 `software-debt-analyst`
- **System Prompt:** "You are the Software Debt analyst. Quantify technical debt and
  obsolescence. For each third-party library and platform component, fetch EOL and
  CVE data, then classify: keep / upgrade / replace / remove with rationale."
- **Tools:** Context7, Brave Search, Fetch, GitHub, Memory.
- **External:** NVD/CVE, endoflife.date, framework release notes.
- **Writes:** `02-reverse/tech-debt-report.md`, `02-reverse/obsolescence-matrix.md`.
- **Done:** every dependency classified; each DEBT-#### has severity + effort.

#### 6.5 `quality-assurance`
- **System Prompt:** "You are QA. Build a golden-master characterization test suite
  of current behavior to guarantee regression safety during migration. Cover
  catalog browse, cart, checkout/payment, and admin flows. Each TEST-#### links to
  a REQ-#### / RULE-####."
- **Tools:** Playwright (E2E capture), Memory.
- **Writes:** `02-reverse/test-cases.md`, `02-reverse/regression-suite/**`.
- **Done:** critical journeys covered; tests runnable & green on legacy app.

### Team #3 — Transformation Target

#### 6.6 `security-analyst`
- **System Prompt:** "You are the Security Analyst. Build the security baseline and
  target controls. Reconcile every detection in the Aggregate Scan Summary with a
  control or accepted risk. Produce a STRIDE threat model and a prioritized
  remediation backlog mapped to OWASP/CWE."
- **Reads:** `docs/📊 Aggregate Scan Summary Report.md`, security hotspots
  (`CreditCardUtil.java`, `EncryptionUtil.java`, payment integrations), architecture.
- **External (REQUIRED):** NVD CVE, OWASP Top 10/ASVS, GitHub Advisories, CWE.
- **Writes:** `03-target/security-baseline.md`, `03-target/threat-model.md`,
  `03-target/remediation-backlog.md`.
- **Done:** every scan detection mapped (control or RISK-#### accepted).

#### 6.7 `compliance-analyst`
- **System Prompt:** "You are the Compliance Analyst. Map GDPR and PCI-DSS
  obligations to the application's data flows (PII + financial/credit-card). Output
  a compliance matrix with lawful basis, control, owner, and gap."
- **External (REQUIRED):** GDPR text, PCI-DSS guidance.
- **Writes:** `03-target/compliance-matrix.md`,
  `03-target/data-protection-requirements.md`.
- **Done:** all PII/financial flows have documented basis + control.

#### 6.8 `coding-framework`
- **System Prompt:** "You are the Coding Framework agent. Define the TARGET stack,
  reference architecture, coding standards, and explicit legacy→target conversion
  patterns (e.g., Struts 2 Action → Spring `@Controller`/REST; Ant → Maven/Gradle;
  JSP/Tiles → modern frontend; Hibernate XML → JPA annotations). Produce OpenAPI for
  exposed APIs. Validate each target choice against Context7 docs and a reference
  starter repo."
- **Tools:** Context7, DeepWiki, GitHub, Memory.
- **External (REQUIRED):** target framework docs & starter repos (e.g.,
  `spring-projects/spring-boot`), build-tool docs.
- **Writes:** `03-target/target-architecture.md`, `03-target/coding-standards.md`,
  `03-target/conversion-patterns.md`, `03-target/api-specifications.yaml` (OpenAPI).
- **Done:** 1:1 mapping documented for every legacy pattern in the as-is architecture.

### Team #4 — Code Generation

#### 6.9 `project-scaffolding`
- **System Prompt:** "You are Project Scaffolding. Generate the modern project
  skeleton and convert code module-by-module per conversion-patterns, preserving
  behavior verified by the regression suite. Open one PR per migration wave. Never
  write into legacy source; target the destination repo / `04-forward/`."
- **Tools:** GitHub (create repo/branch/PR/push), Context7, Memory, native edit.
- **External (REQUIRED):** target framework, dependency registries, destination repo.
- **Writes:** `04-forward/converted/**`, build config, CI/CD definitions.
- **Done:** module compiles, regression tests pass, PR approved.

#### 6.10 `tech-debt-manager`
- **System Prompt:** "You are the Tech Debt Manager. Sequence migration into waves
  respecting dependencies, plan deliveries, and track residual debt. Produce a
  migration roadmap and wave plan with entry/exit criteria and NFR checklist."
- **Tools:** GitHub (issues/milestones/sub-issues), Memory.
- **Writes:** `04-forward/migration-roadmap.md`, `04-forward/wave-planning.md`,
  `04-forward/nfr-checklist.md`.
- **Done:** every module assigned to a wave; dependency order valid (no cycles).

### Cross-Cutting Agents

#### 6.11 `context-indexer`
- **Frontmatter:** stage all, activation always, model_profile extraction.
- **System Prompt:** "You own the Digital Twin retrieval layer. Chunk, embed, and
  link all corpora and generated outputs into the Memory graph. Maintain a corpus
  catalog and serve retrieval to all agents. Re-index on artifact changes."
- **Writes:** `00-twin/corpus-catalog.md`, index manifests.
- **Done:** all corpora indexed; staleness below threshold; retrieval contract published.

#### 6.12 `orchestrator`
- **System Prompt:** "You are the Orchestrator. Drive the staged pipeline per
  `registry.yaml`. Resolve dependencies, dispatch agents, persist run-state,
  enforce stage gates via the HITL Gatekeeper, retry transient failures, and stop on
  hard failures. Never skip a gate."
- **Tools:** delegation (all), Memory.
- **Writes:** `run-state/**`, `run-state/pipeline.md`.
- **Done:** pipeline reaches Stage 4 with all gates passed.

#### 6.13 `hitl-gatekeeper`
- **System Prompt:** "You are the HITL Gatekeeper. At each gate, package the stage's
  outputs into a concise review brief, ask the human for a decision using
  `ask_user_question`, and record the signed decision. Block promotion until
  approved. Capture change requests and route them back to the owning agents."
- **Tools:** Memory, native `ask_user_question`, Fetch.
- **Writes:** `approvals/stage-<N>.md` (decision, reviewer, timestamp, comments).
- **Done:** signed approval recorded for the stage.

#### 6.14 `pii-redaction-filter`
- **Frontmatter:** activation always; runs before any indexing or external call.
- **System Prompt:** "You are the Sensitive Data Filter. Detect and redact PII,
  secrets, and financial data (Presidio/LLMGuard-style) from any artifact before it
  is indexed or sent to an external tool. Log every redaction. Escalate new
  high-confidence detections to HITL."
- **Tools:** GitHub secret scanning, native, Memory.
- **Reads:** all artifacts + `docs/📊 Aggregate Scan Summary Report.md`.
- **Writes:** `00-twin/redaction-log.md`, sanitized artifacts.
- **Done:** zero un-redacted secrets leave the workspace.

#### 6.15 `test-generation`
- **System Prompt:** "You are the Forward Test Generator. From the detailed design
  and the legacy golden-master suite, generate target-stack unit/integration/E2E
  tests. Each target TEST-#### maps to a legacy behavior ID. Ensure coverage gate
  before merge."
- **Tools:** Playwright, Context7, GitHub, Memory.
- **Writes:** `04-forward/tests/**`, `04-forward/coverage-report.md`.
- **Done:** target tests green; coverage threshold met; traceability complete.

#### 6.16 `cicd-integration`
- **System Prompt:** "You implement CI/CD and self-remediation. Wire pipelines
  (build/test/deploy), run tests on each change, and auto-remediate transient
  failures within policy. Gate production changes behind HITL."
- **Tools:** GitHub (Actions, PR checks, status), Fetch, Memory.
- **Writes:** `.github/workflows/**` (dest repo), `04-forward/remediation-playbooks.md`,
  `run-state/ci-logs/**`.
- **Done:** pipeline builds, tests, and self-heals on transient failures.

#### 6.17 `documentation-traceability`
- **Frontmatter:** stage all, activation always.
- **System Prompt:** "You maintain end-to-end traceability (REQ→SPEC→code→TEST) and
  regenerate the retro-documentation set (Application Overview, HLD, Detailed
  Design, Technical Architecture) per `docs/Retro-documentation (AI-Powered).md`.
  Every target artifact must link back to a legacy requirement."
- **Tools:** Memory, native read/write.
- **Writes:** `00-twin/traceability-matrix.md`, regenerated doc set under
  `04-forward/docs/**`.
- **Done:** no orphan artifacts; matrix complete and consistent.

---

## 7. Rules (`.windsurf/rules/`)

### 7.1 `hitl-gates.md` (activation: always)
- A stage cannot transition until `approvals/stage-<N>.md` exists with
  `decision: approved`.
- Rejections record change requests and re-open the owning agents' tasks.
- Production-affecting actions (cicd-integration) require explicit per-action approval.

### 7.2 `data-redaction.md` (activation: always)
- No artifact is indexed or sent to an external MCP/tool before passing
  `pii-redaction-filter`.
- Findings categories mirror the scan report: PII, FINANCIAL, CREDENTIALS.
- New high-confidence detections halt the pipeline and notify HITL.

### 7.3 `traceability.md` (activation: always)
- Every generated element carries a traceability ID (§2.1).
- `documentation-traceability` rejects artifacts lacking back-links.
- Legacy source is read-only; modifications only in `randstad/output/` or dest repo.

---

## 8. Workflows (`.windsurf/workflows/`)

Five workflow files MUST be created. Each follows the Windsurf workflow format:
YAML frontmatter with a `description`, then ordered steps. The `orchestrator`
executes them; a `// turbo` annotation above a step authorizes auto-run of that
step **only when it is safe and read-only** (indexing, reads, artifact writes
inside `randstad/output/`). Steps that call external MCP write APIs (GitHub PRs,
deploys) or that mutate a destination repo are **never** auto-run.

### 8.0 Workflow file format (mandatory)

```markdown
---
description: <short title>
---

# <Workflow Name>

**Stage:** <N>   **Team:** <#>   **Gate:** <stage-N-approval | none>
**Entry criteria:** <preconditions, prior gate approved>
**Exit criteria:** <artifacts present + gate decision recorded>

## Inputs
<artifact paths consumed>

## Steps
1. ...

## Outputs
<artifact paths produced>

## On rejection
<which agents are re-opened, where change requests are recorded>
```

Common conventions for every workflow:
- **Always-on agents** `context-indexer`, `pii-redaction-filter`, and
  `documentation-traceability` run continuously; each step's outputs are redacted
  then indexed before the next step consumes them.
- A step may only start when its `depends_on` (from `registry.yaml`) are complete.
- Each workflow ends by invoking `hitl-gatekeeper`, which writes
  `randstad/output/approvals/stage-<N>.md` and blocks until `decision: approved`.

---

### 8.1 `stage-1-context-discovery.md`
- **description:** "Stage 1 — gather application context and produce verifiable ground truth."
- **Stage/Team/Gate:** 1 / #1 / `stage-1-approval`.
- **Entry criteria:** repository present; MCP servers reachable.
- **Steps:**
  1. *(// turbo)* `context-indexer` indexes the repo into the Twin; writes `00-twin/corpus-catalog.md`.
  2. `appmod-analyst` produces `01-discovery/app-inventory.md`, `module-map.json`,
     and `01-discovery/discovery-answers.md` (all 70 questions, unknowns flagged).
  3. *(// turbo)* `documentation-traceability` initializes `00-twin/traceability-matrix.md` (REQ/SPEC seeds).
  4. `pii-redaction-filter` validates outputs; updates `00-twin/redaction-log.md`.
  5. `hitl-gatekeeper` packages a review brief → **stage-1-approval**.
- **Exit criteria:** inventory + 70 answers present; approval recorded.
- **On rejection:** re-open `appmod-analyst` with logged change requests; re-run from step 2.

### 8.2 `stage-2-digital-twin.md`
- **description:** "Stage 2 — build the digital twin: as-is architecture, functional specs, tech debt, golden-master tests."
- **Stage/Team/Gate:** 2 / #2 / `stage-2-approval`.
- **Entry criteria:** `stage-1-approval` = approved.
- **Steps:**
  1. Run in **parallel** (independent `depends_on: [appmod-analyst]`):
     - `software-architect` → `02-reverse/architecture-as-is.md`, `data-flows.md`, `dependency-graph.json`, C4 mermaid.
     - `business-analyst` → `02-reverse/functional-specifications.md`, `business-rules.md`, `user-stories.md`.
     - `software-debt-analyst` → `02-reverse/tech-debt-report.md`, `obsolescence-matrix.md`.
  2. `quality-assurance` builds `02-reverse/test-cases.md` + `regression-suite/**`
     (depends on `business-analyst`). *Note:* Playwright E2E capture requires the
     legacy app running (`start-tomcat.sh`); **not** auto-run.
  3. `documentation-traceability` links new specs to REQ/RULE IDs.
  4. `pii-redaction-filter` validates; `context-indexer` re-indexes.
  5. `hitl-gatekeeper` → **stage-2-approval**.
- **Exit criteria:** architecture, functional specs, debt report, and runnable
  regression suite present; approval recorded.
- **On rejection:** re-open the specific failing agent(s); re-index; re-submit.

### 8.3 `stage-3-target-design.md`
- **description:** "Stage 3 — define the transformation target: security/compliance baseline and target architecture."
- **Stage/Team/Gate:** 3 / #3 / `stage-3-approval`.
- **Entry criteria:** `stage-2-approval` = approved.
- **Steps:**
  1. Run in **parallel**:
     - `security-analyst` → `03-target/security-baseline.md`, `threat-model.md`,
       `remediation-backlog.md` (reconciles every scan-report detection).
     - `compliance-analyst` → `03-target/compliance-matrix.md`,
       `data-protection-requirements.md`.
  2. `coding-framework` (depends on `software-architect` + `software-debt-analyst`)
     → `03-target/target-architecture.md`, `coding-standards.md`,
     `conversion-patterns.md`, `api-specifications.yaml` (OpenAPI); records ADRs.
  3. `documentation-traceability` maps target patterns back to as-is components.
  4. `pii-redaction-filter` validates external-fetch outputs; `context-indexer` re-indexes.
  5. `hitl-gatekeeper` → **stage-3-approval** (includes ADR review).
- **Exit criteria:** every detection mapped (control or accepted risk); 1:1
  legacy→target pattern mapping; approval recorded.
- **On rejection:** re-open `coding-framework` / analysts; re-submit.

### 8.4 `stage-4-code-generation.md`
- **description:** "Stage 4 — generate the modern application wave by wave with tests and CI/CD."
- **Stage/Team/Gate:** 4 / #4 / `stage-4-approval`.
- **Entry criteria:** `stage-3-approval` = approved; destination repo + token configured.
- **Steps:**
  1. `tech-debt-manager` produces `04-forward/migration-roadmap.md`,
     `wave-planning.md`, `nfr-checklist.md`; **HITL** approves the wave plan.
  2. **For each wave** (loop, dependency order from `wave-planning.md`):
     a. `project-scaffolding` converts modules → `04-forward/converted/**`
        + build config. **Manual** (writes to dest repo / opens PR — never auto-run).
     b. `test-generation` writes `04-forward/tests/**`; produces `coverage-report.md`.
     c. `cicd-integration` runs the pipeline; auto-remediates transient failures
        within policy; production-affecting actions are **manual**.
     d. `hitl-gatekeeper` → per-wave **PR review** gate.
  3. `documentation-traceability` regenerates the retro-doc set under `04-forward/docs/**`.
  4. `hitl-gatekeeper` → **stage-4-approval**.
- **Exit criteria:** each wave's module compiles, regression + target tests green,
  PRs approved; final approval recorded.
- **On rejection:** re-open scaffolding/test-gen for the affected wave only.

### 8.5 `run-end-to-end.md`
- **description:** "Run the full modernization pipeline Stages 1→4 with HITL gates."
- **Stage/Team/Gate:** all / — / all four gates.
- **Entry criteria:** `registry.yaml`, all agents, rules, and MCP config present.
- **Steps:**
  1. *(// turbo)* `orchestrator` loads `registry.yaml`, initializes
     `run-state/state.json` = `INIT`.
  2. `orchestrator` runs `stage-1-context-discovery` → enforces **stage-1-approval**.
  3. `orchestrator` runs `stage-2-digital-twin` → enforces **stage-2-approval**.
  4. `orchestrator` runs `stage-3-target-design` → enforces **stage-3-approval**.
  5. `orchestrator` runs `stage-4-code-generation` → enforces **stage-4-approval**.
  6. `orchestrator` sets state `DONE`; `documentation-traceability` emits the final
     `00-twin/traceability-matrix.md` with zero orphan rows.
- **Cross-cutting:** `pii-redaction-filter`, `context-indexer`, and
  `documentation-traceability` run throughout (always-on).
- **Failure handling:** transient → retry (max 3); hard failure → state `HALT`
  with `run-state/` log; any gate rejection → `REWORK` then re-submit the same gate.
- **Exit criteria:** four signed approvals; non-empty artifacts in every
  `randstad/output/0X-*`; acceptance criteria (§11) met.

---

## 9. Data Contracts (artifact schemas)

Minimum required schemas (JSON/Markdown front-tables). Examples:

**`module-map.json`**
```json
{
  "modules": [
    { "id": "sm-core", "type": "library", "language": "java",
      "responsibilities": ["entities", "services"], "depends_on": [] }
  ]
}
```

**`business-rules.md`** (table): `RULE-#### | description | condition | action | source-file:line`.

**`tech-debt-report.md`** (table): `DEBT-#### | component | issue | severity | effort | action`.

**`remediation-backlog.md`** (table): `RISK-#### | detection | OWASP/CWE | severity | control | status`.

**`compliance-matrix.md`** (table): `data-element | category | regulation | lawful-basis | control | gap`.

**`traceability-matrix.md`** (table): `REQ-#### | SPEC-#### | code-ref | TEST-#### | status`.

**`approvals/stage-<N>.md`** (frontmatter): `stage, decision, reviewer, timestamp, comments[]`.

---

## 10. Orchestration State Machine

```
INIT → INDEX → STAGE1 → GATE1 ─approved→ STAGE2 → GATE2 ─approved→ STAGE3
   → GATE3 ─approved→ STAGE4(waves) → GATE4 ─approved→ DONE
Any GATE rejected → REWORK(owning agents) → re-submit to same GATE
Hard failure → HALT(run-state) ; Transient failure → RETRY(max 3)
```

- State persisted in `run-state/state.json` after each transition.
- `context-indexer`, `pii-redaction-filter`, `documentation-traceability` run as
  always-on side processes across all states.

---

## 11. Acceptance Criteria (demo "definition of done")

- All 17 agent files exist and validate against the §3 schema.
- `registry.yaml`, 5 workflows, 3 rules, 17 prompts, `mcp.config.md` exist.
- A full `run-end-to-end` produces non-empty artifacts in every
  `randstad/output/0X-*` folder.
- 4 signed approvals recorded under `approvals/`.
- `traceability-matrix.md` has zero orphan rows.
- `redaction-log.md` shows all scan-report categories handled; no secrets leaked.
- At least one migrated module compiles and passes a regression test in the dest repo.

---

## 12. Build Order (implementation checklist)

1. Create output store §2.2 and `.windsurf/` skeleton §1.
2. `mcp.config.md` + `registry.yaml`.
3. Rules (§7) — they constrain everything else.
4. Cross-cutting agents: `context-indexer`, `pii-redaction-filter`,
   `orchestrator`, `hitl-gatekeeper`, `documentation-traceability`.
5. Team #1 → #2 → #3 → #4 agents (in dependency order from `registry.yaml`).
6. Prompt templates per agent (externalize System Prompt).
7. Workflows (§8), then `run-end-to-end`.
8. Dry-run Stage 1 with HITL; iterate.

---

**Cross-references:** `randstad/AGENTS.md` (catalog & rationale),
`randstad/CONTEXT.md` (subject application), `docs/` (discovery questionnaire,
CAST tooling, retro-documentation structure, scan report).
