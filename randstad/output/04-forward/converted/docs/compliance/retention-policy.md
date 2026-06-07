# Data Retention & Purge Policy (DPR-0011)

> Implemented by `server/retention.js` (`purge()`), runnable via `POST /api/admin/retention/run`
> and scheduled with the Heartbeat worker. Windows are configurable via env.

| Data | Default window | Env var | Mechanism |
|------|----------------|---------|-----------|
| Agent chat messages (`agent_message`) | 90 days | `RETENTION_AGENT_MESSAGE_DAYS` | auto-delete past window |
| Tool/agent audit (`tool_audit`) | 365 days | `RETENTION_TOOL_AUDIT_DAYS` | kept longer for accountability (DPR-0014) |
| Notifications (`notification`) | 180 days | `RETENTION_NOTIFICATION_DAYS` | auto-delete past window |
| Sessions | 8h idle | `SESSION_TTL_HOURS` | session store expiry |
| Semantic memory (`agent_memory`) | curated | — | minimized + erasable (DPR-0006) |
| Orders / invoices | legal/tax term | — | **retained**, anonymized on erasure |

## Erasure interaction (DPR-0006)
`DELETE /api/account` removes personal rows + chat logs + **pgvector memory** immediately and
anonymizes retained order rows; it does not wait for the retention window.

## Verification
- Unit: `tests/w7/hardening.test.js` checks the retention window helper (`cutoff`).
- The purge logs counts per table for audit.
