# Migration Roadmap — Shopizer → ShopiClaw

**Owner:** `tech-debt-manager`  **Stage:** 4  **Generated:** 2026-06-06

## Strategy

Greenfield generation of the **ShopiClaw** agentic app (ADR-0001/0004) into
`randstad/output/04-forward/converted/**`, mirroring `example/` look & UX, behavior locked
by the Stage 2 golden master (TEST-0001..0028) and the Stage 3 target design. **Not** an
in-place strangler on the Java code; the legacy `sm-*` modules stay read-only as the
behavioral oracle.

## Phases

```mermaid
graph LR
    W0[W0 Foundation+Agent] --> W1[W1 Catalog+RAG]
    W1 --> W2[W2 Cart]
    W2 --> W3[W3 Checkout+Payment]
    W3 --> W4[W4 Orders+Account]
    W4 --> W5[W5 Admin+Analytics]
    W5 --> W6[W6 Interop+Heartbeat]
    W6 --> W7[W7 Hardening+Compliance]
```

## Milestones & exit criteria

| Milestone | Waves | Exit criteria |
|-----------|-------|---------------|
| M1 Walking skeleton | W0–W1 | App boots; theme matches example; agent answers catalog + twin-knowledge queries; TEST-0001..0004 green |
| M2 Buy flow | W2–W3 | Add-to-cart → checkout → tokenized pay; TEST-0005..0014 green; RISK-0001/0015 controls in place |
| M3 Accounts & ops | W4–W5 | Order history/invoice; admin; getBusinessMetrics/getSystemHealth; TEST-0015..0027 green |
| M4 Interop & GA | W6–W7 | MCP server live; heartbeat jobs; security/compliance controls; full E2E green; CI/CD |

## Dependencies & prerequisites (carried from Stage 3)

- **OpenAI** API key + DPA/EU region (DPR-0017); embeddings model `text-embedding-3-large`.
- **PSP** with tokenization/hosted fields (sandbox creds for W3).
- Postgres 16 + pgvector (docker-compose from `example/`).
- Secret manager for Aquaman broker.

## Governance

- Per-wave HITL PR review; production-affecting actions manual.
- Traceability regenerated each wave; redaction validated before any external call/index.
- Golden master is the regression gate; new tests cover agent/MCP/analytics/security.

## Effort (indicative, relative)

W0 L · W1 M · W2 M · W3 L · W4 M · W5 M · W6 M · W7 L. Critical path: W0→W3→W7.
