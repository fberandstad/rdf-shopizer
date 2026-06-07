---
stage: 3
decision: approved
reviewer: franck (human, HITL)
timestamp: 2026-06-06T06:45:00Z
gate: stage-3-approval
recorded_by: hitl-gatekeeper
comments:
  - "Approved the ShopiClaw target design (agentic, OpenClaw-style) and all 13 ADRs."
  - "Confirmed: full rewrite to the example/ Node+React agentic stack (ADR-0004), not Java-to-Java."
  - "Confirmed: OpenAI as LLM/embeddings provider (ADR-0003); Gemini dropped."
  - "Confirmed additions: embedded Digital Twin knowledge (ADR-0011), health + functional self-reporting (ADR-0012), MCP server exposure (ADR-0013)."
  - "Payment tokenization (ADR-0006) resolves legacy PCI debt; requires a tokenizing PSP selection in Stage 4."
  - "All 46 scan detections reconciled (RISK-0001..0024); GDPR/PCI mapped (DPR-0001..0018)."
  - "Carried to Stage 4: PSP choice, OpenAI DPA/EU data region (DPR-0017), MCP client onboarding policy, vector-erasure tooling (DPR-0006), consent capture (DPR-0008), recover legacy JAR versions (V1-V3), confirm inferred rules RULE-0004/0019/0021, run golden-master E2E on the target."
---

# Stage 3 Approval Record

**Decision:** APPROVED — Stage 4 (Code Generation) may begin.

## Approved artifacts (`03-target/`)
- `target-architecture.md` (C4 + ShopiClaw agent design + ADR-0001..0013)
- `conversion-patterns.md`, `coding-standards.md`, `api-specifications.yaml`
- `security-baseline.md`, `threat-model.md`, `remediation-backlog.md`
- `compliance-matrix.md`, `data-protection-requirements.md`
- Twin: +2 entities/+4 relations; `00-twin/traceability-matrix.md` & `redaction-log.md` extended

## ShopiClaw — what was approved
- **Agentic app** (OpenClaw-modeled): Gateway + Agent Loop (OpenAI tool-calling, serialized, max 12 iters) + Markdown memory + pgvector semantic memory + RAG + Heartbeat + Skills.
- **Stack** from `example/`: React+Vite+CopilotKit, Node/Express+TS, Postgres16+pgvector, Prisma, Redis, Docker.
- **Commerce as deterministic services exposed via typed agent tools**; money-path never improvised.
- **Safety:** ClawBands (HITL tool approval), Aquaman (credential isolation), payment tokenization (PCI SAQ-A).
- **Embedded Digital Twin knowledge** with cited retrieval (ADR-0011).
- **Health + functional analytics self-reporting** via named, role-scoped queries (ADR-0012).
- **MCP server** exposing read/safe tools + twin resources to other agents; guarded tools gated (ADR-0013).

## Exit criteria (met)
- Every scan detection mapped to a control or accepted risk: 46/46 → RISK-0001..0024. ✔
- 1:1 legacy→target mapping (FS/RULE → tool/service + artifact). ✔
- ADRs recorded and reviewed (ADR-0001..0013). ✔
- GDPR/PCI/AI mapped (DPR-0001..0018); LLM Top-10 controls defined. ✔
- Redaction validated; no leaks; no HALT. ✔
- Signed HITL decision recorded. ✔

## Carried conditions into Stage 4
1. Select tokenizing PSP; configure OpenAI DPA + EU data region (DPR-0017).
2. Define MCP client onboarding/allow-list policy; default-deny guarded tools.
3. Implement vector-erasure tooling (DPR-0006), consent capture (DPR-0008), retention jobs (DPR-0011), DPIA (DPR-0015).
4. Recover legacy JAR versions (V1–V3); confirm inferred rules RULE-0004/0019/0021.
5. Run golden-master E2E (TEST-0001..0028) + new guarded-tool/MCP/analytics tests against the target.

## Next stage
Stage 4 — `stage-4-code-generation` (Team #4): wave-by-wave generation with tests and CI/CD.
Entry criteria (`stage-3-approval = approved`) satisfied.
