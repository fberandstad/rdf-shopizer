# Functional Specifications — Shopizer v1.1.5

**Owner:** `business-analyst`  **Stage:** 2  **Generated:** 2026-06-06  **Gate:** stage-2-approval

> Functional behavior recovered from Struts actions, services, JSP/Tiles views, and
> CAST transaction traces. Each feature cites source + (where applicable) UI evidence.
> Playwright E2E observation requires the running app (`start-tomcat.sh`) — **not run**;
> UI evidence drawn from `docs/.../User Experience/**` and admin screenshots. Each
> feature carries an `FS-####` id and links to REQ-/RULE- ids.

## Module: Storefront (sm-shop)

### FS-0001 Catalog browsing  ·  REQ-0010, REQ-0014
Browse store landing, categories, product details, search. Actions: `LandingAction`,
`CategoryListAction`, `ProductDetailsAction`, `SearchAction`, `StorePageAction`
(`sm-shop/src/.../catalog/**`). Views via Tiles (`tiles-catalog`). Locale/currency from session.

### FS-0002 Shopping cart  ·  REQ-0010, RULE-0001..0007
Add/update/remove items; mini-cart and full cart. Actions: `MiniShoppingCartAction`,
`ShoppingCartAction`, `StoreShoppingCartAction`. Server recomputes totals/tax
(`assembleItems → updateOrderTotal → calculateTax`). Evidence: CAST addToCart Tx 335326/335335.

### FS-0003 Checkout flow  ·  REQ-0008, RULE-0008..0012
Multi-step: init → customer info → shipping → payment → commit order → display order.
Actions: `InitCheckoutAction`, `CustomerInformationAction`, `ShippingAction`,
`PaymentAction`, `ComitOrderAction`, `DisplayOrderSummaryAction`
(`sm-shop/src/.../checkout/flow/**`). Orchestrated by `orderWorkflow`
(`sm-core-workflow-beans.xml:21-30`).

### FS-0004 Payment  ·  REQ-0017, RULE-0009..0012
Pluggable gateways via `PaymentModule.processTransaction` (authorize/capture/sale per
merchant config); PayPal Express via `initTransaction`/`PayPalExpressCheckoutAction`;
external-return via `postTransaction`. Evidence: `PaymentModule.java:38-67`;
`*TransactionImpl.java`.

### FS-0005 Invoicing  ·  REQ-0008
Display invoice summary, payment confirmation, optional print (external HTTP).
Actions: `InvoiceAction`, `DisplayInvoiceSummaryAction`, `ComitInvoiceAction`,
`InvoicePaymentAction`. Evidence: CAST invoiceSummary Tx 335344/335621.

### FS-0006 Customer account  ·  REQ-0009, RULE-0013
Register/login, profile, addresses, order history, product reviews. Actions:
`LogonAction`, `ProfileAction`, `AddressAction`, `OrdersAction`, `ReviewsAction`
(`sm-shop/src/.../customer/profile/**`).

### FS-0007 Subscriptions  ·  REQ-0010
Newsletter/subscription signup. Action: `SubscriptionAction` (PII handling — see redaction R9).

### FS-0008 Social / CMS integration  ·  REQ-0017
Facebook page integration + OAuth, dynamic CMS pages. Actions: `FbPageAction`,
`OauthRequestAction`, `PageAction`; `FacebookIntegrationFactory`. Dynamic labels in `DYNAMIC_LABEL`.

### FS-0009 File/content download  ·  RULE-0015
Serve static files and protected product digital downloads. Action: `FilesAction`
(role-gated). Evidence: CAST/`FilesController` doc (upstream parity).

## Module: Administration (sm-central)

### FS-0010 Admin authentication & RBAC  ·  REQ-0009, RULE-0016..0017
Login via `CustomAuthFilter` on `*.action`; roles/functions from `MerchantUserRole`,
`CentralGroup`, `CentralFunction`. Evidence: `sm-central/.../web.xml:11-19`.

### FS-0011 Catalog management  ·  REQ-0010
CRUD products, categories, manufacturers, attributes, pricing, images (CKEditor, Jcrop).
73 admin actions; Tiles `tiles-catalog`. Evidence: `sm-central/src/**`, `struts-catalog.xml`.

### FS-0012 Order & invoice management  ·  REQ-0008
View/process orders, manage invoices. `struts-order.xml`, `struts-invoice.xml`;
`invoicePaymentConfirmation.jsp`.

### FS-0013 Store / merchant configuration  ·  REQ-0014, RULE-0018
Configure store, payment, shipping, tax, currencies, countries/geozones. Config persisted
(often encrypted) in `MERCHANT_CONFIGURATION`. `struts-{payment,shipping,tax,store}.xml`.

### FS-0014 Payment & shipping setup  ·  REQ-0017
Enable/configure gateways and carriers; supported credit cards per store
(`getSupportedCreditCards`). Evidence: CAST invoiceSummary §2.1.

### FS-0015 SOAP web services  ·  SPEC-0041
Expose `salesManagerCustomerService`, `salesManagerInvoiceService` via JAX-WS.
Evidence: `sm-central/.../web.xml:54-68`.

## Feature → evidence coverage

| FS | Source code | UI evidence | Status |
|----|-------------|-------------|--------|
| FS-0001..0009 | sm-shop actions + services | docs UX notes | recovered |
| FS-0010..0015 | sm-central actions + web.xml | admin screenshots (`docs/.../admin0xx`) | recovered |

**E2E confirmation pending:** dynamic UI validation requires running app; flagged for QA (`test-cases.md`, TEST-* marked `pending-e2e`).
