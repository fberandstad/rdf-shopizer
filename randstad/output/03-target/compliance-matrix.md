# Compliance Matrix — ShopiClaw

**Owner:** `compliance-analyst`  **Stage:** 3  **Generated:** 2026-06-06  **Gate:** stage-3-approval
**Schema:** `data-element | category | regulation | lawful-basis | control | gap`
**Regulations:** GDPR (EU 2016/679), PCI-DSS v4.0. Plus AI governance (EU AI Act transparency).

> Maps every PII/financial data element (from the scan report + domain model) to a lawful
> basis and control. ShopiClaw introduces agent memory/RAG over personal data — covered.

## 1. Data inventory → compliance

| Data element | Category | Regulation | Lawful basis | Control | Gap |
|--------------|----------|-----------|--------------|---------|-----|
| Customer name/email/phone | PII | GDPR | Contract (Art.6(1)b) | RBAC, encryption at rest, access log | — |
| Billing/shipping address | PII | GDPR | Contract | encryption, access control | — |
| Order history | PII | GDPR | Contract + legitimate interest | owner-only access (RULE-0013) | — |
| Payment card (PAN) | FINANCIAL | PCI-DSS | Contract | **Tokenization — no PAN stored** (ADR-0006) → SAQ-A scope | resolves legacy |
| Payment token/ref | FINANCIAL | PCI-DSS | Contract | token only; provider vault | — |
| Newsletter email (`SubscriptionAction`) | PII | GDPR | **Consent (Art.6(1)a)** | opt-in + withdraw; double opt-in | add consent capture |
| Gateway/carrier credentials | CREDENTIALS | PCI/sec | — | Aquaman broker; secret manager | — |
| Agent conversation logs | PII (possible) | GDPR | Legitimate interest | minimization, retention limit, erasure | define retention |
| Agent semantic memory (pgvector) | PII (possible) | GDPR | Legitimate interest | tagged PII, erasure across vectors, access control | erasure tooling (Stage 4) |
| RAG embeddings of customer data | PII (possible) | GDPR | Legitimate interest | restrict to non-PII corpora; allow-list sources | governance policy |
| Reviews | PII | GDPR | Consent/legitimate interest | moderation; erasure | — |

## 2. GDPR principles → controls

| Principle | Control in ShopiClaw |
|-----------|----------------------|
| Lawfulness/consent | Consent capture for marketing (newsletter); contract basis for orders |
| Data minimization | Prompts/memory store minimal PII; redaction before LLM/index (data-redaction rule) |
| Purpose limitation | Agent tools scoped; RAG over policy/catalog, not raw PII by default |
| Storage limitation | Retention schedule for sessions/memory/logs; auto-purge |
| Integrity/confidentiality | Encryption at rest/in transit; RBAC; audit |
| Rights (access/erasure/portability) | Data-subject endpoints; **erasure must cascade to vector memory + RAG** |
| Accountability | tool_audit trail; DPIA for the agent (see data-protection-requirements) |
| Transparency (AI Act) | Disclose AI agent to users; human escalation path |

## 3. PCI-DSS posture

- **Scope reduction to SAQ-A**: PAN never enters ShopiClaw (hosted fields/tokenization).
- No card data in logs, memory, prompts, or DB (enforced by redaction + Aquaman).
- Quarterly dependency scanning; access control to payment integration code.
- Legacy non-compliance (CAST: unpatched payment libs, weak session expiry) **resolved** by redesign.

## 4. AI-specific obligations

| Obligation | Control |
|-----------|---------|
| Transparency | UI discloses "ShopiClaw AI"; not impersonating human |
| Human oversight | ClawBands HITL on consequential actions (refunds, admin) |
| Data governance | Training/RAG data documented; no covert profiling |
| Logging | Agent decisions auditable (tool_audit) |
| Right to human review | Escalation to human support from chat |

## 5. Coverage

- All PII/financial data flows have a documented lawful basis + control. **0 unmapped.**
- Gaps (consent capture, retention schedule, vector-erasure tooling) are assigned to Stage 4
  and tracked in `data-protection-requirements.md`.
