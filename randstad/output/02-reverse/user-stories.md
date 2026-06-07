# User Stories — Shopizer v1.1.5 (recovered)

**Owner:** `business-analyst`  **Stage:** 2  **Generated:** 2026-06-06

> Reverse-engineered from implemented behavior (not original backlog). Each story links
> to `FS-####`, `RULE-####`, and source. Acceptance criteria describe **current** behavior
> (golden master), to be locked by QA `TEST-####`.

## Epic: Shopper — Browse & Buy

### US-0001 Browse catalog  ·  FS-0001
As a shopper, I can browse the landing page, categories, and product details, so I can find products.
- **AC:** category/product pages render localized names/prices; search returns matching products.
- Source: `LandingAction`, `CategoryListAction`, `ProductDetailsAction`, `SearchAction`.

### US-0002 Manage cart  ·  FS-0002 · RULE-0001..0007
As a shopper, I can add/update/remove items and see totals, so I can review my purchase.
- **AC:** add validates product/attributes/qty; same SKU+options merges; totals + tax recomputed server-side; mini-cart updates.
- Source: `ShoppingCartAction`, `MiniShoppingCartAction`; CAST addToCart.

### US-0003 Checkout & pay  ·  FS-0003, FS-0004 · RULE-0008..0012
As a shopper, I can enter customer/shipping/payment info and place an order, so I can complete a purchase.
- **AC:** workflow runs processCustomer→processPayment→processOrder→email; card auth/capture per config; PayPal Express token flow; order persisted only on success; thank-you page shows order.
- Source: checkout flow actions; `OrderWorkflowProcessor`; `PaymentModule`.

### US-0004 View orders & invoices  ·  FS-0005, FS-0006 · RULE-0013,0014
As a registered customer, I can view my order history and invoices, so I can track purchases.
- **AC:** only owner/admin can view; payment data masked; invoice summary shows line items/totals; optional print.
- Source: `OrdersAction`, `InvoiceAction`, `DisplayInvoiceSummaryAction`; CAST displayOrder/invoiceSummary.

### US-0005 Manage account  ·  FS-0006
As a shopper, I can register, log in, edit profile/addresses, and post reviews.
- **AC:** login authenticates; profile/address CRUD; reviews tied to customer+product.
- Source: `LogonAction`, `ProfileAction`, `AddressAction`, `ReviewsAction`.

### US-0006 Download purchased digital products  ·  FS-0009 · RULE-0015
As a customer with rights, I can download product digital files securely.
- **AC:** download requires role; missing file → 404.
- Source: `FilesAction`; `FilesController` doc.

### US-0007 Subscribe to newsletter  ·  FS-0007
As a visitor, I can subscribe with my email.
- **AC:** email captured (PII); confirmation behavior per config.
- Source: `SubscriptionAction`.

## Epic: Store Admin — Operate the Store

### US-0008 Sign in to admin securely  ·  FS-0010 · RULE-0016,0017
As an admin, I can sign in and access only authorized functions.
- **AC:** `*.action` requires auth; access gated by role/function.
- Source: `CustomAuthFilter`; role entities.

### US-0009 Manage catalog  ·  FS-0011
As an admin, I can CRUD products/categories/manufacturers/attributes/prices/images.
- **AC:** changes persist and appear in storefront; image edit via CKEditor/Jcrop.
- Source: `sm-central` catalog actions; `struts-catalog.xml`.

### US-0010 Manage orders & invoices  ·  FS-0012
As an admin, I can view and process orders and manage invoices.
- **AC:** order list/detail; invoice payment confirmation.
- Source: `struts-order.xml`, `struts-invoice.xml`.

### US-0011 Configure store/payment/shipping/tax  ·  FS-0013, FS-0014 · RULE-0018..0020
As an admin, I can configure store settings, gateways, carriers, tax zones, currencies/countries.
- **AC:** gateway credentials stored encrypted; supported cards per store; tax by geo-zone.
- Source: `struts-{payment,shipping,tax,store}.xml`; `MERCHANT_CONFIGURATION`.

### US-0012 Integrate external services  ·  FS-0008, FS-0015
As an admin/store, I can integrate Facebook and expose SOAP services.
- **AC:** FB page/OAuth; `salesManagerCustomerService` / `salesManagerInvoiceService` reachable.
- Source: `FbPageAction`, `OauthRequestAction`; `sm-central/.../web.xml:54-68`.

## Coverage summary

| Epic | Stories | FS linked | Critical for golden master |
|------|---------|-----------|----------------------------|
| Shopper | US-0001..0007 | FS-0001..0009 | cart, checkout/payment, order view |
| Admin | US-0008..0012 | FS-0010..0015 | auth, catalog mgmt, order/invoice |

All stories are seeded into `00-twin/traceability-matrix.md` (US→FS→RULE→TEST).
