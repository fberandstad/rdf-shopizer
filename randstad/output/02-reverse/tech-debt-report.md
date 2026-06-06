# Technical Debt Report — Shopizer v1.1.5

**Owner:** `software-debt-analyst`  **Stage:** 2  **Generated:** 2026-06-06
**Schema:** `DEBT-#### | component | issue | severity | effort | action` (SPECS.md §9)
**Classification:** keep / upgrade / replace / remove

> Severity: Critical/High/Medium/Low. Effort: S (<1wk), M (1–4wk), L (1–3mo), XL (>3mo)
> per module. Debt grounded in verified local stack + `obsolescence-matrix.md`. CAST
> modern-fork metrics cited as context only (flagged).

| DEBT | Component | Issue | Severity | Effort | Action |
|------|-----------|-------|----------|--------|--------|
| DEBT-0001 | JDK 1.5 runtime | EOL since 2009; no modern crypto/TLS/lang features; blocks all modern libs | Critical | L | replace → JDK 17/21 LTS |
| DEBT-0002 | Struts 2 (old 2.x) | EOL line; history of critical RCE CVEs; tight action/JSP coupling | Critical | XL | replace → Spring Boot MVC/REST |
| DEBT-0003 | Spring 2.5 (XML DI) | EOL ~2012; verbose XML; no annotations/boot | High | L | upgrade → Spring Boot 3.x (annotation/Java config) |
| DEBT-0004 | Hibernate 3.x XML mappings | EOL; `.hbm.xml` (81) instead of JPA annotations | High | L | upgrade → JPA/Hibernate 6 + annotations |
| DEBT-0005 | Apache Tiles | Apache Attic (retired 2018); no fixes | High | L | replace → modern frontend (SPA) or Thymeleaf |
| DEBT-0006 | DWR | Abandoned (~2011); legacy AJAX RPC | High | M | replace → REST/JSON + fetch |
| DEBT-0007 | JAX-WS/Axis SOAP | Obsolete SOAP stack; Axis1 EOL | High | L | replace → REST (OpenAPI) |
| DEBT-0008 | OSCache | Defunct project (~2007); in-VM cache blocks scaling | High | M | replace → Caffeine / Redis |
| DEBT-0009 | Apache Ant build | No dependency mgmt; JARs vendored/gitignored; no SCA | High | M | replace → Maven/Gradle |
| DEBT-0010 | log4j 1.x | EOL 2015; unsupported | High | S | upgrade → SLF4J + Logback/log4j2 |
| DEBT-0011 | Servlet/JSP 2.4–2.5 | Very old Java EE; server-rendered views | Medium | L | migrate views to modern stack |
| DEBT-0012 | Groovy 1.5.5 / JasperReports (old) | Ancient versions; reporting risk | Medium | M | upgrade or replace reporting |
| DEBT-0013 | No automated tests (G4) | No JUnit/test roots in legacy source → unsafe refactor | Critical | L | build golden-master suite (QA, this stage) then unit/integration |
| DEBT-0014 | HTTPS disabled | `transport-guarantee` commented out; checkout over HTTP | Critical | S | enforce TLS-only (config) |
| DEBT-0015 | Custom auth filter | Hand-rolled `CustomAuthFilter`; no modern session/CSRF controls | High | M | replace → Spring Security |
| DEBT-0016 | Card data handling | Custom `CreditCardUtil`/`EncryptionUtil`; PCI scope in-app | Critical | L | replace → tokenization / PCI-compliant gateway flows (Stage 3) |
| DEBT-0017 | Encrypted config in `MERCHANT_CONFIGURATION` | App-managed key (`SecretKeySpec`); key mgmt unclear | High | M | externalize secrets (vault/KMS) |
| DEBT-0018 | High-complexity methods | `calculateTax` 36, `assembleItems` 31, `displayProduct` 32 (CAST traces) | Medium | M | refactor; cover with tests first |
| DEBT-0019 | Stateful sessions + file I/O | Blocks containerization/horizontal scale | High | L | externalize session/state; cloud storage |
| DEBT-0020 | i18n via custom bundle loaders | Custom `TemplateResourceBundleLoader` | Low | S | standard i18n in target stack |
| DEBT-0021 | Vendored JARs, versions unknown (G1) | Cannot run SCA; supply-chain blind spot | High | S | recover JARs; produce SBOM |
| DEBT-0022 | `media` web app missing (G2) | Referenced in docs, absent in checkout | Medium | S | locate/confirm scope before migration |

## Severity rollup

| Severity | Count | IDs |
|----------|-------|-----|
| Critical | 5 | DEBT-0001, 0002, 0013, 0014, 0016 |
| High | 11 | 0003,0004,0005,0006,0007,0008,0009,0010,0015,0017,0019,0021 *(12 listed; 0021 High)* |
| Medium | 5 | 0011,0012,0018,0022 + drivers |
| Low | 1 | 0020 |

## Modernization blockers (must resolve early)

1. **No test safety net (DEBT-0013)** → golden-master suite is the gate for safe migration (QA artifact).
2. **JDK 1.5 + Ant + vendored JARs (DEBT-0001/0009/0021)** → no build/SCA modernization possible until resolved.
3. **PCI/HTTPS (DEBT-0014/0016)** → security-critical; Stage 3 security/compliance.

## Cross-reference (modern fork, context only)

CAST `Short Audit Report.md`: 79 CVEs, 152 XSS (CWE-79), ISO-5055 maintainability 1,083
violations, 438 instantiations-in-loops, 115 empty catch blocks. **Pertains to modern fork**
— not asserted against local v1.1.5; informs target NFRs in Stage 3.

All DEBT ids linked in `00-twin/traceability-matrix.md`.
