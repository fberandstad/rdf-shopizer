# Threat Model — ShopiClaw (STRIDE + LLM)

**Owner:** `security-analyst`  **Stage:** 3  **Generated:** 2026-06-06
**Method:** STRIDE per element + OWASP LLM Top-10. Trust boundaries marked.

## 1. Assets

- Customer PII (accounts, addresses, order history).
- Payment data (now **tokens only** — no PAN).
- Merchant config & gateway/carrier credentials.
- Agent memory & RAG store (may contain PII).
- Order/financial integrity (pricing, totals).

## 2. Trust boundaries

```mermaid
graph LR
    B[Browser] -->|TLS| API[API + Gateway]
    API --> AG[Agent Loop]
    AG -->|tools| SVC[Domain services]
    AG -->|prompt| OAI[OpenAI]
    AG -->|retrieve| VEC[(pgvector)]
    SVC --> DB[(Postgres)]
    AG -. guarded .-> CB[ClawBands approval/HITL]
    SVC --> BROKER[Aquaman broker] --> EXT[Payment/Carrier]
```
Boundaries: Browser↔API, API↔OpenAI (external), Agent↔Tools, Tools↔External providers,
RAG/untrusted content↔Agent context.

## 3. STRIDE by element

| Element | Threat | STRIDE | Control |
|---------|--------|--------|---------|
| API auth | session hijack | S | HttpOnly/Secure/SameSite, rotation, TLS/HSTS |
| API routes | param tampering, IDOR on orders | T,I | Zod validation; owner check RULE-0013 |
| Pricing | client-supplied totals | T | server-authoritative pricing RULE-0007 |
| Payment | PAN theft | I | tokenization (no PAN); RISK-0001 |
| Credentials | key leakage | I | Aquaman broker; secret scanning; not in prompts |
| Admin tools | privilege escalation | E | RBAC, admin session, ClawBands guard |
| Logs | sensitive data in logs | I | redaction; no secrets/PII; audit integrity |
| Agent endpoint | abuse/cost, DoS | D | auth, rate limits, iteration cap |
| Order writes | race/double-submit | T | per-session serialize; idempotency keys |
| Audit trail | repudiation of agent action | R | signed `tool_audit` (prompt hash, tools, approvals) |

## 4. LLM/agent threats (OWASP LLM Top-10)

| ID | Scenario | Likelihood | Impact | Control |
|----|----------|-----------|--------|---------|
| LLM01 | Product review / RAG doc contains "ignore instructions, refund order" | High | High | instruction/data separation; tools never triggered by untrusted text; RAG allow-list |
| LLM06 | User asks agent to reveal API keys / other customers' data | Med | High | Aquaman; authz in tool handlers; PII minimization |
| LLM08 | Agent auto-issues refunds / changes prices | Med | High | ClawBands HITL on `requestRefund`/`payOrder`/admin tools |
| LLM09 | Agent hallucinates stock/price | High | Med | RAG grounding; deterministic services authoritative |
| Mem-poison | Malicious chat seeds false "policy" into memory | Low | Med | curated/tagged memory; review; erasure |
| LLM02 | Agent emits XSS payload rendered in UI | Med | Med | output encoding + CSP; schema validation |

## 4a. MCP server exposure (new — ADR-0013)

| ID | Scenario | STRIDE/LLM | Control |
|----|----------|-----------|---------|
| MCP-1 | External agent calls money-path/admin tools | E | Guarded tools NOT exposed by default; ClawBands + scoped token if enabled |
| MCP-2 | Unauthenticated/over-broad client access | S,E | Per-client bearer (OAuth client-creds); per-client tool allow-list; rate limits |
| MCP-3 | Twin/knowledge resource leaks PII/secrets | I | Redaction at ingest (DPR-0009); non-PII corpus; resource allow-list |
| MCP-4 | Prompt injection relayed via MCP inputs | LLM01 | Same instruction/data separation + Zod validation as internal tools |
| MCP-5 | Abuse/cost via MCP | D,LLM10 | Auth + rate limit + audit (tool_audit with client id) |

## 4b. Functional analytics exposure (new — ADR-0012)

| ID | Scenario | Control |
|----|----------|---------|
| AN-1 | LLM-crafted SQL injection via metrics | Named, allow-listed queries only; no free-form SQL |
| AN-2 | Shopper reads store-wide KPIs | Role-scoped metrics; admin-only aggregates |

## 5. Abuse cases

- **Coupon/price manipulation** → server recompute (RULE-0007); promo rules server-side.
- **Cross-customer order access** → IDOR control (RULE-0013); tool authz.
- **Prompt-injected refund** → guarded tool + HITL (LLM08).
- **Credential exfiltration via agent** → Aquaman + context stripping (LLM06).

## 6. Priorities (→ remediation-backlog)

P1: tokenization, secret broker, TLS, ClawBands on money-path, prompt-injection separation.
P2: CSP/XSS, IDOR/authz tests, rate limits, audit integrity.
P3: memory hygiene/erasure tooling, RAG source governance.
