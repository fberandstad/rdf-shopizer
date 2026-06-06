# Traceability Matrix — Shopizer Modernization

**Owner:** `documentation-traceability`  **Initialized:** 2026-06-06 (Stage 1)
**Schema:** `REQ-#### | SPEC-#### | code-ref | TEST-#### | status` (SPECS.md §9)

> Seeded in Stage 1 from `01-discovery/discovery-answers.md`. `TEST-####` and
> downstream `code-ref` columns are populated in later stages (QA golden master →
> Stage 2; target code → Stage 4). `pending` = awaiting a later-stage artifact.
> Per `rules/traceability.md`, the final matrix must have **zero orphan rows**.

## Requirements (business / functional)

| REQ | SPEC | code-ref (legacy) | TEST | Status |
|-----|------|-------------------|------|--------|
| REQ-0001 Identity: name | — | README.md:1 | — | seeded |
| REQ-0002 Version 1.1.5 | — | README.md:1 | — | seeded |
| REQ-0003 Release date | — | README.md:3 | — | seeded |
| REQ-0004 Owner/stakeholders | — | README.md:118-122 | — | partial (org owner unknown) |
| REQ-0005 Support contact | — | README.md:122 | — | seeded |
| REQ-0006 Platform (web/Java EE) | SPEC-0023 | README.md:13,97-104 | — | seeded |
| REQ-0008 Business objective | — | README.md:7-11 | — | seeded |
| REQ-0009 User segments | — | OVERVIEW.md:64-89 | — | seeded |
| REQ-0010 Value features | REQ-0014 | OVERVIEW.md:38-54 | pending | seeded |
| REQ-0011 Differentiators | — | payment/shipping modules | — | partial |
| REQ-0012 Revenue model | — | OVERVIEW.md:9 | — | partial (unknown) |
| REQ-0013 Regulation applicability | REQ-0058 | scan report | — | flagged (Stage 3) |
| REQ-0014 Features & modules | SPEC-0024 | module-map.json | pending | seeded |
| REQ-0016 UX measures | SPEC-0015 | web.xml:13-18 | pending | seeded |
| REQ-0021 KPIs | — | — | — | UNKNOWN |
| REQ-0022 Maintenance/support | — | README.md:118-122 | — | partial |
| REQ-0058 Compliance (PCI/GDPR) | SPEC-0056 | scan report | — | flagged (Stage 3) |
| REQ-0069 Roadmap | SPEC-0070 | — | — | pipeline output (Stage 4) |

## Specifications (technical / architectural)

| SPEC | REQ | code-ref (legacy) | TEST | Status |
|------|-----|-------------------|------|--------|
| SPEC-0007 Tech stack | REQ-0006 | OVERVIEW.md:24-31; web.xml; sm-core/build.xml:21-45 | — | seeded |
| SPEC-0015 UI/Tiles/JSP | REQ-0016 | sm-central/.../web.xml:103-106 | pending | seeded |
| SPEC-0017 External integrations | REQ-0017 | module/impl/integration/** | pending | seeded |
| SPEC-0018 Data storage | SPEC-0037 | sm-core/conf/hibernate/*.hbm.xml | — | seeded |
| SPEC-0019 Security measures | SPEC-0054 | sm-central/.../web.xml:11-19 | pending | seeded (gap: HTTPS off) |
| SPEC-0020 Scalability | SPEC-0063 | oscache.properties | — | partial |
| SPEC-0023 Architecture style | REQ-0014 | OVERVIEW.md:13-20 | — | seeded |
| SPEC-0024 Components | SPEC-0023 | app-inventory.md §2 | — | seeded |
| SPEC-0025 Data flows | SPEC-0041 | service/workflow/order/ProcessPayment.java | pending | seeded |
| SPEC-0027 Data entities | SPEC-0018 | sm-core/conf/hibernate/*.hbm.xml (81) | pending | seeded |
| SPEC-0029 Security architecture | SPEC-0054 | sm-central/.../web.xml:11-19 | pending | seeded |
| SPEC-0030 Deployment | SPEC-0067 | README.md:97-99; schema/upgrade | — | seeded |
| SPEC-0031 Design patterns | — | source tree | — | seeded |
| SPEC-0034 Error handling | — | exception/; CentralIntegrationError.hbm.xml | pending | seeded |
| SPEC-0035 Logging | SPEC-0049 | log4j.properties | — | seeded |
| SPEC-0036 Testing strategy | — | (none found) | pending | flagged gap G4 (Stage 2 QA) |
| SPEC-0037 Database | SPEC-0018 | README.md:27-35; schema/ | — | seeded |
| SPEC-0039 Data at rest/in transit | SPEC-0056 | EncryptionUtil.java; web.xml:71-86 | pending | flagged (HTTPS off) |
| SPEC-0041 Integration/endpoints | SPEC-0017 | sm-central/.../web.xml:54-68 | pending | seeded |
| SPEC-0042 API standard (SOAP) | SPEC-0041 | web.xml; corpus-catalog discrepancy | — | seeded |
| SPEC-0043 API docs (WSDL/Javadoc) | — | sm-core/build.xml:86-104 | — | seeded |
| SPEC-0044 API security | SPEC-0054 | web.xml | — | flagged (Stage 3) |
| SPEC-0054 AuthN/AuthZ | SPEC-0019 | CustomAuthFilter; web.xml:11-19 | pending | seeded |
| SPEC-0055 Roles/permissions | SPEC-0054 | MerchantUserRole*.hbm.xml; CentralGroup.hbm.xml | pending | seeded |
| SPEC-0056 Sensitive-data protection | REQ-0058 | EncryptionUtil.java; CreditCardUtil.java | pending | flagged (PCI, Stage 3) |
| SPEC-0062 Optimization (cache) | SPEC-0020 | oscache.properties; web.xml | — | seeded |
| SPEC-0063 Scaling design | SPEC-0020 | start-tomcat.sh:12 | — | partial |
| SPEC-0067 Update/patch | SPEC-0030 | README.md:97-99; schema/upgrade | — | seeded |
| SPEC-0070 Obsolescence strategy | REQ-0069 | README.md:17-22 | — | flagged (Stage 2/3) |

## Open items (UNKNOWN — no legacy evidence; carried forward)

| ID | Topic | Owner stage |
|----|-------|-------------|
| SPEC-0040 | Backup & recovery | Stage 3 |
| SPEC-0045 | API versioning | Stage 3 |
| SPEC-0046 | API performance/monitoring | Stage 3 |
| SPEC-0047/0048/0064 | Monitoring/alerting | Stage 3 |
| SPEC-0051/0053 | Incident mgmt / DR | Stage 3 |
| SPEC-0060/0061 | Load testing / bottlenecks | Stage 2 |
| REQ-0021 | KPIs | Stage 2/3 |

**Orphan check (Stage 1):** all seeded rows trace to a discovery answer + source cite or are explicitly flagged UNKNOWN. No orphan rows. `TEST-####` linkage begins in Stage 2.
