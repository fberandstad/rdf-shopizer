# Glossary — Shopizer v1.1.5 Domain & Technical Terms

**Owner:** `appmod-analyst`  **Stage:** 1  **Generated:** 2026-06-06

> Domain and technical vocabulary recovered from the legacy codebase. Each term cites
> source evidence. Used by all downstream agents for consistent naming.

## Domain terms

| Term | Definition | Evidence |
|------|------------|----------|
| MerchantStore | A configured store/tenant; root of multi-store config | `MerchantStore.hbm.xml` |
| Merchant / MerchantUser | Store operator account with roles | `MerchantUserInformation.hbm.xml`, `MerchantUserRole.hbm.xml` |
| Customer | End-user shopper account + profile | `Customer.hbm.xml`, `CustomerInfo.hbm.xml` |
| Catalog | Products, categories, manufacturers, descriptions | `Category*.hbm.xml`, `Manufacturers*.hbm.xml` |
| Product | Sellable item with pricing, attributes, reviews | catalog entities |
| CustomerBasket | Persistent shopping cart contents | `CustomerBasket*.hbm.xml` |
| Order / OrderProduct / OrderAccount | Placed order, line items, account postings | `Order*.hbm.xml` |
| CreditCard / CentralCreditCard | Card payment instrument (sensitive) | `CreditCard.java`, `CentralCreditCard.hbm.xml` |
| PaymentMethod / PaymentModule | Configurable payment gateway integration | `PaymentMethod.java`, `module/model/integration/PaymentModule.java` |
| Invoice | Billing document for an order | SOAP `salesManagerInvoiceService` |
| GeoZone / Country / Currency | Reference data for tax/shipping/locale | `GeoZone.hbm.xml`, `Country*.hbm.xml`, `Currency.hbm.xml` |
| Tax (GeoZoneTaxTemplate) | Zone-based tax calculation template | `GeoZoneTaxTemplate.hbm.xml` |
| Shipping quote | Carrier rate lookup (Fedex/UPS/USPS/CanadaPost) | `module/impl/integration/shipping/` |
| MerchantConfiguration | Key/value store config | `MerchantConfiguration.hbm.xml` |
| IntegrationError / IntegrationService | Recorded integration failures + service defs | `CentralIntegrationError.hbm.xml`, `CentralIntegrationService.hbm.xml` |

## Technical terms

| Term | Definition | Evidence |
|------|------------|----------|
| sm-core | Core library JAR (entities, services, integrations) | `sm-core/build.xml` |
| sm-central | Admin web application | `sm-central/.../web.xml` |
| sm-shop | Customer storefront web application | `sm-shop/.../web.xml` |
| Action (Struts2) | Request handler unit (`*.action`) | `web.xml`, `struts.xml` |
| Tiles definition | Composed JSP page layout | `tiles-*.xml` context-params |
| DWR | Direct Web Remoting — JS↔Java AJAX bridge | `DWRServlet` mapping |
| Module (integration) | Pluggable payment/shipping strategy | `sm-modules.xml` |
| ProcessPayment | Spring-managed order payment workflow step | `service/workflow/order/ProcessPayment.java` |
| CustomAuthFilter | Servlet filter enforcing admin authentication | `sm-central/.../web.xml:11-19` |
| GatewayTransactionVO | Value object for gateway transaction data | `service/payment/GatewayTransactionVO.java` |
| ReferenceLoaderServlet | Startup loader for reference/menu data | `web.xml` (both apps) |
| HSQLDB | In-memory/embedded test database (default) | `README.md:27-35` |

## Acronyms

| Acronym | Meaning |
|---------|---------|
| ORM | Object-Relational Mapping (Hibernate) |
| DI | Dependency Injection (Spring) |
| MVC | Model-View-Controller (Struts 2) |
| JAX-WS | Java API for XML Web Services (SOAP) |
| WAR | Web Application Archive |
| VO / DTO | Value Object / Data Transfer Object |
| PII | Personally Identifiable Information |
| PCI-DSS | Payment Card Industry Data Security Standard |
