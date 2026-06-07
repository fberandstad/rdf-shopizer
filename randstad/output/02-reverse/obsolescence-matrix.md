# Obsolescence Matrix — Shopizer v1.1.5

**Owner:** `software-debt-analyst`  **Stage:** 2  **Generated:** 2026-06-06
**Sources:** local build evidence + endoflife.date / vendor EOL (general knowledge, **verify**).

> **Version caveat (G1):** dependency JARs are gitignored (`lib/**` holds only
> readme/license stubs). Versions below are inferred from the 2011-08-14 release date,
> classpath groupings (`sm-core/build.xml:21-45`), and license files. Items marked
> *(inferred)* MUST be confirmed against actual JARs before remediation. CVE
> applicability is **version-dependent** and is therefore representative, not asserted.

| Component | Local version | Status | EOL (approx) | Risk | Notes |
|-----------|---------------|--------|--------------|------|-------|
| Java SE (JDK) | 1.5 | obsolete | public EOL 2009 | Critical | `README.md:21-22`, `rebuild-all.sh:3`; no modern TLS/crypto, no modules |
| Apache Ant | 1.6+ | legacy | maintained but superseded | Medium | no dependency mgmt; superseded by Maven/Gradle |
| Struts 2 | 2.1.x/2.2.x *(inferred)* | obsolete/vulnerable | old 2.x lines EOL | Critical | family has multiple RCE CVEs (e.g., S2-045/CVE-2017-5638, S2-057) — applicability version-dependent |
| Spring Framework | 2.5 | obsolete | OSS EOL ~2012 | High | `sm-core-workflow-beans.xml:9` (spring-beans-2.5.xsd); XML DI era |
| Hibernate | 3.x *(inferred)* | obsolete | Hibernate 3 EOL | High | XML `.hbm.xml` mappings; pre-JPA-annotation style |
| Apache Tiles | 2.x *(inferred)* | retired | Apache Attic (2018) | High | project retired; no upstream fixes |
| DWR | 2.x/3.x *(inferred)* | unmaintained | last release ~2011 | High | AJAX RPC; effectively abandoned |
| JAX-WS (Metro) + Axis | Metro/Axis1 *(inferred)* | obsolete | Axis1 EOL | High | SOAP stack; `sm-core/lib/axis` |
| OSCache | 2.x *(inferred)* | retired | OpenSymphony defunct (~2007) | High | caching; dead project |
| Groovy | 1.5.5 | obsolete | 1.5 line EOL | Medium | `lib/misc/groovy-all-1.5.5-LICENSE.txt` (2008-era) |
| JasperReports | old *(inferred)* | obsolete | old line EOL | Medium | `lib/misc/jasperreports-LICENSE.txt` |
| log4j | 1.x *(inferred)* | obsolete | log4j 1.x EOL 2015 | High | `log4j.properties`; 1.x unsupported (note: CVE-2021-44228 affects log4j2, not 1.x) |
| Servlet/JSP | 2.4 (shop) / 2.5 (central) | obsolete | very old Java EE | Medium | `web.xml` version attrs |
| Database drivers | HSQLDB/MySQL/Oracle (old) | mixed | driver-dependent | Medium | versions UNKNOWN |
| SimpleCaptcha | old *(inferred)* | obsolete | unmaintained | Low | `SimpleCaptchaModule.java` |

## Platform-level obsolescence

- **Runtime:** JDK 1.5 + servlet container (Tomcat 6 era per README PermGen tuning) — both EOL.
- **Build:** Ant without dependency management → fragile, no SCA possible without manual JAR audit.
- **Architecture:** stateful sessions + in-VM OSCache → blocks horizontal scaling / containerization.
- **Frontend:** server-rendered JSP/Tiles + jQuery plugins (meiomask, Jcrop, CKEditor old) — deprecated client patterns.

## CAST cross-reference (modern-fork — NOT local)

The CAST audit reports 40 OSS packages / 79 CVEs (Jackson, Bootstrap, Elasticsearch,
Infinispan, Antisamy, AWS SDK, Drools, HtmlUnit). **These pertain to the modern upstream
fork**, not local v1.1.5, and are recorded for Stage 3 context only (`Short Audit Report.md`
§5). They are **excluded** from local DEBT severity.

## Verification actions (carried)

- **V1:** Obtain actual JARs (from a built WAR or vendor archive) to confirm versions and run real SCA (NVD).
- **V2:** Confirm Struts 2 minor version → determines exact RCE CVE exposure.
- **V3:** Confirm log4j 1.x vs 2.x; confirm Hibernate/Tiles/DWR minors.
