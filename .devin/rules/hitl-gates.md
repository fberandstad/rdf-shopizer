---
trigger: always_on
description: Human-In-The-Loop stage gates for the modernization pipeline
---

# Rule: HITL Gates

Source: `randstad/SPECS.md` §7.1.

- A stage MUST NOT transition until `randstad/output/approvals/stage-<N>.md` exists
  with `decision: approved`.
- The `hitl-gatekeeper` agent is the only writer of approval records.
- A rejection (`decision: rejected`) records change requests and re-opens the
  owning agents' tasks; the stage re-runs and re-submits to the same gate.
- Production-affecting actions (any `cicd-integration` deploy/merge,
  `project-scaffolding` PR creation) require **explicit per-action human approval**
  and are NEVER auto-run.
- `github` write tools are restricted to the destination repo and are gated.
- Approval record schema (frontmatter): `stage, decision, reviewer, timestamp,
  comments[]`.
