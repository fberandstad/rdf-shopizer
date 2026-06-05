---
trigger: always_on
description: PII/secret redaction before indexing or external tool calls
---

# Rule: Data Redaction

Source: `randstad/SPECS.md` §7.2. Aligns with `docs/📊 Aggregate Scan Summary Report.md`.

- No artifact is indexed into the Twin or sent to an external MCP/tool
  (`fetch`, `brave-search`, `github`, `deepwiki`) before passing
  `pii-redaction-filter`.
- Detection categories mirror the scan report: **PII**, **FINANCIAL**, **CREDENTIALS**.
- Known hotspots to always check: `sm-core/.../util/CreditCardUtil.java`,
  `sm-core/.../util/EncryptionUtil.java`, payment integrations
  (`BeanStreamTransactionImpl.java`, `PaypalTransactionImpl.java`).
- New high-confidence detections HALT the pipeline and notify HITL.
- Every redaction is logged to `randstad/output/00-twin/redaction-log.md`.
- Goal: zero un-redacted secrets ever leave the workspace.
