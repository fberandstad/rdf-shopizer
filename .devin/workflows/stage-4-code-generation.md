---
description: Stage 4 — generate the modern application wave by wave with tests and CI/CD
---

# Stage 4 — Code Generation

**Stage:** 4   **Team:** #4   **Gate:** stage-4-approval
**Entry criteria:** `stage-3-approval` = approved; destination repo + token configured.
**Exit criteria:** each wave's module compiles, regression + target tests green, PRs approved; `approvals/stage-4.md` = approved.

## Inputs
- `randstad/output/03-target/**`, `randstad/output/02-reverse/regression-suite/**`.

## Steps
1. `tech-debt-manager` produces `04-forward/migration-roadmap.md`, `wave-planning.md`,
   `nfr-checklist.md`; **HITL** approves the wave plan.
2. **For each wave** (loop, dependency order from `wave-planning.md`):
   a. `project-scaffolding` converts modules → `04-forward/converted/**` + build
      config. **Manual** — writes to dest repo / opens PR (never auto-run).
   b. `test-generation` writes `04-forward/tests/**`; produces `coverage-report.md`.
   c. `cicd-integration` runs the pipeline; auto-remediates transient failures within
      policy; production-affecting actions are **manual**.
   d. `hitl-gatekeeper` → per-wave **PR review** gate.
3. `documentation-traceability` regenerates the retro-doc set under `04-forward/docs/**`.
4. `hitl-gatekeeper` → **stage-4-approval**.

## Outputs
- `04-forward/migration-roadmap.md`, `wave-planning.md`, `nfr-checklist.md`.
- `04-forward/converted/**`, `04-forward/tests/**`, `04-forward/coverage-report.md`.
- `04-forward/remediation-playbooks.md`, `04-forward/docs/**`.

## On rejection
Re-open scaffolding/test-gen for the affected wave only; re-submit to the relevant gate.
