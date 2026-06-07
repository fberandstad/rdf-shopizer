# TOOLS — ShopiClaw conventions

Tools are typed (`{ name, description, sensitivity, parameters(zod), handler }`) and live in
`agent/tools/`. The LLM may only *invoke* tools; handlers enforce business rules server-side.

## Sensitivity tiers
- **read** — auto-run, audited (e.g., `searchCatalog`, `getProduct`, `ragSearch`,
  `twinKnowledgeSearch`, `getSystemHealth`, `getBusinessMetrics`).
- **write** — auto-run with audit (e.g., cart ops — later waves).
- **guarded** — require ClawBands **HITL approval** (e.g., `payOrder`, `requestRefund`,
  `manageCatalog`, `manageInventory`). Configured via `CLAWBANDS_GUARDED_TOOLS`.

## Rules
- Never put secrets/PII in prompts. Credentials are used only inside handlers via Aquaman.
- Money-path is deterministic; pricing/totals are server-authoritative (RULE-0007).
- `getBusinessMetrics` is role-scoped (admin) and uses named allow-listed queries (no free-form SQL).
- MCP exposes only the read/safe tools listed in `tools/index.js` (`MCP_SAFE`); guarded tools are default-deny.
- Every tool call is recorded in `tool_audit`.
