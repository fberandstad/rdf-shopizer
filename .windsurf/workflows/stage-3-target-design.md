---
description: Stage 3 — define the transformation target (security/compliance baseline and target architecture)
---

# Stage 3 — Transformation Target

**Stage:** 3   **Team:** #3   **Gate:** stage-3-approval
**Entry criteria:** `stage-2-approval` = approved.
**Exit criteria:** every detection mapped (control or accepted risk); 1:1 legacy→target mapping; `approvals/stage-3.md` = approved.

## Inputs
- `randstad/output/02-reverse/**`, `docs/📊 Aggregate Scan Summary Report.md`.

## Steps
1. Run in **parallel**:
   - `security-analyst` → `03-target/security-baseline.md`, `threat-model.md`, `remediation-backlog.md`.
   - `compliance-analyst` → `03-target/compliance-matrix.md`, `data-protection-requirements.md`.
2. `coding-framework` (depends on `software-architect` + `software-debt-analyst`) →
   `03-target/target-architecture.md`, `coding-standards.md`, `conversion-patterns.md`,
   `api-specifications.yaml` (OpenAPI); records ADRs.
3. `documentation-traceability` maps target patterns back to as-is components.
4. `pii-redaction-filter` validates external-fetch outputs; `context-indexer` re-indexes.
5. `hitl-gatekeeper` → **stage-3-approval** (includes ADR review).

## Outputs
- `03-target/security-baseline.md`, `threat-model.md`, `remediation-backlog.md`.
- `03-target/compliance-matrix.md`, `data-protection-requirements.md`.
- `03-target/target-architecture.md`, `coding-standards.md`, `conversion-patterns.md`, `api-specifications.yaml`.

## On rejection
Re-open `coding-framework` / analysts; re-submit to stage-3-approval.
