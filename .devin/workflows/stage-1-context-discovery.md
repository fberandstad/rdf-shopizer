---
description: Stage 1 — gather application context and produce verifiable ground truth
---

# Stage 1 — Context Discovery

**Stage:** 1   **Team:** #1   **Gate:** stage-1-approval
**Entry criteria:** repository present; MCP servers reachable.
**Exit criteria:** inventory + 70 discovery answers present; `approvals/stage-1.md` = approved.

## Inputs
- `sm-core/**`, `sm-central/**`, `sm-shop/**`, `schema/**`, `README.md`, `OVERVIEW.md`, `docs/**`.

## Steps
// turbo
1. `context-indexer` indexes the repo into the Twin; writes `randstad/output/00-twin/corpus-catalog.md`.
2. `appmod-analyst` produces `randstad/output/01-discovery/app-inventory.md`,
   `module-map.json`, and `discovery-answers.md` (all 70 questions; unknowns flagged).
// turbo
3. `documentation-traceability` initializes `randstad/output/00-twin/traceability-matrix.md` (REQ/SPEC seeds).
4. `pii-redaction-filter` validates outputs; updates `randstad/output/00-twin/redaction-log.md`.
5. `hitl-gatekeeper` packages a review brief and requests a decision → **stage-1-approval**.

## Outputs
- `01-discovery/app-inventory.md`, `01-discovery/module-map.json`, `01-discovery/discovery-answers.md`.
- `00-twin/corpus-catalog.md`, `00-twin/glossary.md`, `00-twin/traceability-matrix.md`.

## On rejection
Re-open `appmod-analyst` with logged change requests; re-run from step 2; re-submit to stage-1-approval.
