---
trigger: always_on
description: End-to-end traceability and read-only legacy source
---

# Rule: Traceability

Source: `randstad/SPECS.md` §7.3, §2.1.

- Every generated artifact element carries a traceability ID:
  `REQ-####`, `RULE-####`, `SPEC-####`, `TEST-####`, `RISK-####`, `DEBT-####`,
  `CVE-<id>`.
- `documentation-traceability` REJECTS any artifact lacking back-links
  (requirement → spec → code → test).
- The final `randstad/output/00-twin/traceability-matrix.md` MUST have zero orphan rows.
- Legacy source under `sm-core/`, `sm-central/`, `sm-shop/`, `schema/` is
  **read-only**. Modifications are allowed only in `randstad/output/` or the
  separate destination repo.
- Claims must cite source `file:line` or a document path; no fabrication —
  unknowns are flagged explicitly.
