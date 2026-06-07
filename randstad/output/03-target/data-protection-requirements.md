# Data Protection Requirements — ShopiClaw

**Owner:** `compliance-analyst`  **Stage:** 3  **Generated:** 2026-06-06

> Actionable DP requirements derived from `compliance-matrix.md`. Each carries a `DPR-####`
> id, linked in the traceability matrix; Stage 4 implements and tests them.

## Encryption & secrets

- **DPR-0001** TLS 1.2+ only, HSTS; no plaintext transport (resolves legacy HTTPS-off).
- **DPR-0002** Encrypt PII at rest (DB column/-disk encryption).
- **DPR-0003** No card PAN stored anywhere; tokenization only (PCI SAQ-A).
- **DPR-0004** Secrets via Aquaman broker + secret manager; never in code/DB/prompts/logs.

## Data-subject rights (GDPR)

- **DPR-0005** Access/portability endpoint exporting a customer's personal data.
- **DPR-0006** **Erasure** must cascade to: relational rows, agent conversation logs,
  **pgvector semantic memory**, and RAG embeddings. (Vector-erasure tooling required.)
- **DPR-0007** Rectification of profile data.
- **DPR-0008** Consent management for marketing (newsletter opt-in/withdraw; double opt-in).

## Minimization & retention

- **DPR-0009** Redact PII/secrets **before** sending to OpenAI or indexing (enforces
  `rules/data-redaction.md` at runtime).
- **DPR-0010** Prompt/memory store minimal PII; tag PII entries for lifecycle control.
- **DPR-0011** Retention schedule: sessions (e.g., 8h idle), agent logs (e.g., 90d),
  memory (curated, reviewable), order data (legal/tax retention). Auto-purge jobs.

## Agent governance & transparency

- **DPR-0012** Disclose AI agent to users; provide human-escalation path.
- **DPR-0013** ClawBands HITL approval for consequential/automated decisions (refunds, admin).
- **DPR-0014** Maintain `tool_audit` (who/what/approval/outcome) for accountability.
- **DPR-0015** DPIA for the ShopiClaw agent (profiling/automated-decision assessment).
- **DPR-0016** RAG source governance: allow-listed, non-PII-by-default corpora.

## Data processing & transfers

- **DPR-0017** Document OpenAI as a processor; DPA in place; configure no-training/retention
  controls on the API; assess data-transfer/region requirements (EU data).
- **DPR-0018** Log lawful basis per processing activity (RoPA).

## Verification

- Each DPR maps to a security control (`security-baseline.md`) and/or RISK
  (`remediation-backlog.md`) and will have an acceptance test in Stage 4.
- **Open Stage-4 items:** vector-erasure tooling (DPR-0006), consent capture (DPR-0008),
  retention jobs (DPR-0011), DPIA (DPR-0015), OpenAI DPA/region config (DPR-0017).
