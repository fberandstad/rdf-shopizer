# MEMORY — ShopiClaw (curated long-term notes)

Git-versioned, human-inspectable long-term memory. Semantic/episodic memory lives in the
`agent_memory` pgvector table; this file holds durable, reviewed facts and policies.

## Store facts
- Currency: EUR (default). Prices stored in minor units (cents).
- Pricing/totals are computed server-side; never trust client-provided amounts.

## Policies (placeholders — fill from `rag_document` collection 'policy')
- Returns: TBD (ingest store policy).
- Shipping: TBD.

## Notes
- PII written to semantic memory is tagged and subject to erasure (GDPR, DPR-0006).
- Keep this file free of secrets and personal data.
