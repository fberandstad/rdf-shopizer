# Data Protection Impact Assessment — ShopiClaw Agent (DPR-0015)

> Scope: the ShopiClaw AI shopping assistant (CopilotKit + OpenAI) embedded in the
> commerce app. Covers automated processing, profiling risk, and LLM-specific risks.
> Traceability: DPR-0009..0016, RISK-0014..0024.

## 1. Processing description
- **Purpose:** assist customers (catalog search, cart, order status) and admins (analytics,
  guarded catalog/inventory). Conversational, tool-calling agent.
- **Data categories:** account profile (name, email, phone), addresses, order history,
  cart contents, chat messages, minimized tagged memory. **No card PAN** (tokenized, ADR-0006).
- **Processors:** OpenAI (LLM + embeddings) — see RoPA + DPA (DPR-0017).

## 2. Necessity & proportionality
- Tool handlers enforce business rules server-side; the LLM cannot bypass authz (ADR-0005).
- Server-authoritative pricing (RULE-0007); no LLM-only consequential decisions.
- PII minimized and **redacted before** any external call / indexing (DPR-0009, redaction rule).

## 3. Risks & mitigations (LLM Top-10 mapped)
| Risk | Mitigation | Ref |
|------|-----------|-----|
| Prompt injection (LLM01) | instruction/data separation; Zod validation on tool inputs | RISK-0014 |
| Sensitive info disclosure (LLM06) | Aquaman secret isolation; authz in handlers; PII minimization | RISK-0016/0023 |
| Excessive agency (LLM08) | ClawBands HITL on money-path/admin tools; iteration cap 12 | RISK-0015 |
| Over-reliance (LLM09) | RAG grounding; deterministic services authoritative | RISK-0017 |
| Memory poisoning | tagged/curated memory; erasure support (DPR-0006) | — |
| MCP over-exposure | default-deny money-path; per-client token + allow-list + rate limit + audit | RISK-0022 |

## 4. Data-subject rights
- Access/portability: `GET /api/account/export` (DPR-0005).
- Erasure incl. pgvector memory + chat logs: `DELETE /api/account` (DPR-0006).
- Rectification: `PUT /api/account/profile` (DPR-0007).
- Consent withdrawal: `POST /api/newsletter/withdraw` (DPR-0008).

## 5. Transparency (DPR-0012)
- `GET /api/ai-disclosure` + in-app notice; human-escalation path provided.

## 6. Residual risk & decision
- Residual risk: **Low–Medium**, accepted with the controls above and the audit trail
  (`tool_audit`, DPR-0014). Re-assess on material change to tools, model, or data flows.
