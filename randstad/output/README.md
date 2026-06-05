# Modernization Output Store

Artifacts produced by the `.windsurf/` agent pipeline. Layout per `randstad/SPECS.md` §2.2.

```
randstad/output/
├── 00-twin/        # shared knowledge: graph dumps, corpus catalog, glossary, traceability, redaction log
├── 01-discovery/   # Stage 1 (Team #1 — Context Discovery)
├── 02-reverse/     # Stage 2 (Team #2 — Reverse Engineering)
├── 03-target/      # Stage 3 (Team #3 — Transformation Target)
├── 04-forward/     # Stage 4 (Team #4 — Code Generation)
├── approvals/      # HITL decisions per stage (stage-<N>.md)
└── run-state/      # orchestrator logs & state transitions
```

Legacy source (`sm-core/`, `sm-central/`, `sm-shop/`, `schema/`) is **read-only**.
All generated content lands here or in the separate destination repo.
