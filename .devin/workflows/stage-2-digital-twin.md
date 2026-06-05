---
description: Stage 2 — build the digital twin (as-is architecture, functional specs, tech debt, golden-master tests)
---

# Stage 2 — Reverse Engineering (Digital Twin)

**Stage:** 2   **Team:** #2   **Gate:** stage-2-approval
**Entry criteria:** `stage-1-approval` = approved.
**Exit criteria:** architecture, functional specs, debt report, runnable regression suite present; `approvals/stage-2.md` = approved.

## Inputs
- `randstad/output/01-discovery/**`, legacy code, `schema/`, CAST docs.

## Steps
1. Run in **parallel** (all depend on `appmod-analyst`):
   - `software-architect` → `02-reverse/architecture-as-is.md`, `data-flows.md`, `dependency-graph.json`, C4 mermaid.
   - `business-analyst` → `02-reverse/functional-specifications.md`, `business-rules.md`, `user-stories.md`.
   - `software-debt-analyst` → `02-reverse/tech-debt-report.md`, `obsolescence-matrix.md`.
2. `quality-assurance` builds `02-reverse/test-cases.md` + `regression-suite/**`
   (depends on `business-analyst`). E2E capture requires the legacy app running
   (`start-tomcat.sh`) — **not** auto-run.
3. `documentation-traceability` links new specs to REQ/RULE IDs.
4. `pii-redaction-filter` validates; `context-indexer` re-indexes.
5. `hitl-gatekeeper` → **stage-2-approval**.

## Outputs
- `02-reverse/architecture-as-is.md`, `data-flows.md`, `dependency-graph.json`.
- `02-reverse/functional-specifications.md`, `business-rules.md`, `user-stories.md`.
- `02-reverse/tech-debt-report.md`, `obsolescence-matrix.md`.
- `02-reverse/test-cases.md`, `02-reverse/regression-suite/**`.

## On rejection
Re-open the specific failing agent(s); re-index; re-submit to stage-2-approval.
