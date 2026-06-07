# MCP Configuration

Required MCP servers, scopes, and per-agent tool allow-lists for the modernization
pipeline. See `randstad/SPECS.md` §5 for the authoritative source.

## Servers

| Server | Scope | Notes |
|--------|-------|-------|
| `memory` | Digital Twin graph (entities, relations, observations) | all agents R/W |
| `context7` | Library/framework docs | `resolve-library-id` before `get-library-docs` |
| `github` | Repos, PRs, issues, advisories, secret scan | dest-repo writes require token |
| `deepwiki` | Repo Q&A / wiki | upstream + framework repos |
| `brave-search` | Web/CVE/EOL/regulatory discovery | rate-limited |
| `fetch` | Retrieve standards/advisory pages as markdown | redact before index |
| `playwright` | Dynamic UI discovery + E2E | requires running app (`start-tomcat.sh`) |

## Per-agent tool allow-list

Any tool not listed for an agent is **denied**. Names use `<server>.<tool>`.

| Agent | Allowed MCP tools |
|-------|-------------------|
| `appmod-analyst` | memory.create_entities, memory.create_relations, memory.add_observations, memory.read_graph, memory.search_nodes; github.get_file_contents, github.search_code, github.list_commits; deepwiki.read_wiki_structure, deepwiki.read_wiki_contents, deepwiki.ask_question; fetch.fetch |
| `software-architect` | memory.create_entities, memory.create_relations, memory.add_observations, memory.read_graph, memory.open_nodes; context7.resolve-library-id, context7.get-library-docs; deepwiki.ask_question, deepwiki.read_wiki_contents |
| `business-analyst` | memory.create_entities, memory.create_relations, memory.add_observations, memory.search_nodes; playwright.browser_navigate, playwright.browser_snapshot, playwright.browser_click, playwright.browser_take_screenshot; fetch.fetch |
| `software-debt-analyst` | memory.create_entities, memory.add_observations, memory.read_graph; context7.resolve-library-id, context7.get-library-docs; brave-search.brave_web_search; fetch.fetch; github.list_releases, github.get_latest_release, github.search_code |
| `quality-assurance` | memory.create_entities, memory.add_observations, memory.search_nodes; playwright.browser_navigate, playwright.browser_snapshot, playwright.browser_click, playwright.browser_type, playwright.browser_fill_form, playwright.browser_evaluate, playwright.browser_console_messages, playwright.browser_network_requests |
| `security-analyst` | memory.create_entities, memory.create_relations, memory.add_observations, memory.read_graph; brave-search.brave_web_search; fetch.fetch; github.search_code, github.list_commits |
| `compliance-analyst` | memory.create_entities, memory.add_observations, memory.search_nodes; brave-search.brave_web_search; fetch.fetch |
| `coding-framework` | memory.create_entities, memory.create_relations, memory.add_observations, memory.read_graph; context7.resolve-library-id, context7.get-library-docs; deepwiki.read_wiki_structure, deepwiki.read_wiki_contents, deepwiki.ask_question; github.get_file_contents, github.search_repositories |
| `project-scaffolding` | memory.read_graph, memory.search_nodes, memory.add_observations; context7.resolve-library-id, context7.get-library-docs; github.create_repository, github.create_branch, github.create_or_update_file, github.push_files, github.create_pull_request, github.get_file_contents |
| `tech-debt-manager` | memory.read_graph, memory.add_observations, memory.create_relations; github.issue_write, github.sub_issue_write, github.search_issues, github.list_pull_requests |
| `context-indexer` | memory.create_entities, memory.create_relations, memory.add_observations, memory.read_graph, memory.search_nodes, memory.open_nodes, memory.delete_observations; fetch.fetch |
| `orchestrator` | memory.read_graph, memory.search_nodes, memory.add_observations, memory.create_relations |
| `hitl-gatekeeper` | memory.read_graph, memory.add_observations; native ask_user_question; fetch.fetch |
| `pii-redaction-filter` | memory.add_observations, memory.search_nodes; github.run_secret_scanning |
| `test-generation` | memory.read_graph, memory.add_observations; context7.resolve-library-id, context7.get-library-docs; playwright.browser_navigate, playwright.browser_snapshot, playwright.browser_click, playwright.browser_fill_form, playwright.browser_evaluate; github.create_or_update_file, github.push_files |
| `cicd-integration` | memory.add_observations, memory.read_graph; github.create_or_update_file, github.push_files, github.pull_request_read, github.merge_pull_request, github.create_branch; fetch.fetch |
| `documentation-traceability` | memory.read_graph, memory.search_nodes, memory.open_nodes, memory.create_relations, memory.add_observations |

## Write-scope & safety

- `github` write tools are restricted to the **destination repo** and are **never
  auto-run** (HITL/manual — see `.windsurf/rules/hitl-gates.md`).
- `memory.delete_*` is granted only to `context-indexer` for staleness pruning.
- All `fetch` / `brave-search` outputs pass `pii-redaction-filter` before indexing
  (see `.windsurf/rules/data-redaction.md`).
