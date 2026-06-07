# Record of Processing Activities (RoPA) — ShopiClaw (DPR-0018)

> Article 30 GDPR record. Lawful basis logged per activity. Traceability: DPR-0001..0018.

| # | Processing activity | Data categories | Lawful basis | Retention | Recipients/Processors |
|---|---------------------|-----------------|--------------|-----------|-----------------------|
| 1 | Account & authentication | name, email, phone, password hash | Contract (Art.6-1-b) | until erasure; tombstoned on request | — |
| 2 | Orders & invoicing | order items, totals, shipping addr, masked payment token | Contract + Legal obligation (tax) | **anonymized & retained** per tax law (DPR-0011) | PSP (token only) |
| 3 | Cart | product refs, quantities | Contract | session / purge | — |
| 4 | Marketing newsletter | email, consent flag | Consent (Art.6-1-a) | until withdrawal (DPR-0008) | — |
| 5 | Product reviews | rating, text, user link | Legitimate interest | until erasure | — |
| 6 | AI assistant (chat) | messages, tagged minimized memory | Contract + Consent | agent logs 90d; memory curated (DPR-0011) | **OpenAI** (DPR-0017) |
| 7 | Tool/agent audit | actor, tool, approval, outcome | Legal obligation / accountability | 365d (DPR-0014) | — |
| 8 | Interop (B2B) | minimized customer + masked invoice | Contract / legitimate interest | n/a (read-only facade) | authorized B2B clients (token) |

## Processors & transfers
- **OpenAI** — LLM + embeddings. DPA required; configure no-training/zero-retention; assess
  EU data region / SCCs for transfers (DPR-0017). PII redacted before transmission (DPR-0009).

## Security measures (summary)
- TLS/HSTS (DPR-0001), encryption of secrets at rest (RULE-0018), RBAC + owner checks,
  CSP/XSS controls, rate limiting, tokenized payments (no PAN, DPR-0003), audit trail.
