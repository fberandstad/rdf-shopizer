---
description: Run the full modernization pipeline Stages 1 to 4 with HITL gates
---

# Run End-to-End

**Stage:** all   **Gate:** all four stage gates.
**Entry criteria:** `.windsurf/registry.yaml`, all agents, rules, and `mcp.config.md` present.
**Exit criteria:** four signed approvals; non-empty artifacts in every `randstad/output/0X-*`; §11 acceptance criteria met.

## Steps
// turbo
1. `orchestrator` loads `.windsurf/registry.yaml`, initializes `randstad/output/run-state/state.json` = `INIT`.
2. `orchestrator` runs `/stage-1-context-discovery` → enforces **stage-1-approval**.
3. `orchestrator` runs `/stage-2-digital-twin` → enforces **stage-2-approval**.
4. `orchestrator` runs `/stage-3-target-design` → enforces **stage-3-approval**.
5. `orchestrator` runs `/stage-4-code-generation` → enforces **stage-4-approval**.
6. `orchestrator` sets state `DONE`; `documentation-traceability` emits the final
   `randstad/output/00-twin/traceability-matrix.md` with zero orphan rows.

## Cross-cutting (always-on)
- `pii-redaction-filter`, `context-indexer`, and `documentation-traceability` run throughout.

## Failure handling
- Transient → retry (max 3). Hard failure → state `HALT` with `run-state/` log.
- Any gate rejection → `REWORK` then re-submit the same gate.
