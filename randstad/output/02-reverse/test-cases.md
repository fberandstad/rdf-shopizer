# Golden-Master Test Cases — Shopizer v1.1.5

**Owner:** `quality-assurance`  **Stage:** 2  **Generated:** 2026-06-06
**Schema:** `TEST-#### | journey | steps | expected | links`
**Purpose:** characterize **current** behavior to guarantee regression safety during migration.

> **E2E status:** dynamic capture requires the legacy app running (`start-tomcat.sh`,
> shop `http://localhost:9080/shop/`, central `/central/`). Per workflow, this is **not
> auto-run**. Tests are authored now and marked `pending-e2e`; they execute when
> `BASE_URL_SHOP` / `BASE_URL_CENTRAL` are set (see `regression-suite/README.md`).

## Critical journeys

| TEST | Journey | Steps (summary) | Expected (golden master) | Links | E2E |
|------|---------|-----------------|--------------------------|-------|-----|
| TEST-0001 | Catalog landing | open `/shop/` | landing renders; categories/products visible; localized | US-0001, FS-0001, REQ-0010 | pending-e2e |
| TEST-0002 | Browse category | open a category page | product list for category; prices formatted | FS-0001, RULE-0007 | pending-e2e |
| TEST-0003 | Product details | open product page | name, price, attributes, add-to-cart present | FS-0001 | pending-e2e |
| TEST-0004 | Search | submit search term | matching products returned | FS-0001 | pending-e2e |
| TEST-0005 | Add to cart (valid) | add product+qty+attrs | item in cart; totals+tax computed server-side; mini-cart count++ | FS-0002, RULE-0001/0002/0007 | pending-e2e |
| TEST-0006 | Add to cart (invalid qty) | qty <= 0 | rejected; error; cart unchanged | RULE-0003 | pending-e2e |
| TEST-0007 | Merge same SKU | add same SKU+options twice | single line, quantity summed | RULE-0005 | pending-e2e |
| TEST-0008 | Update/remove cart item | change qty / remove | totals recomputed | FS-0002 | pending-e2e |
| TEST-0009 | Checkout customer info | proceed to checkout, enter customer | advances to shipping | FS-0003, RULE-0008 | pending-e2e |
| TEST-0010 | Shipping selection | choose shipping method | shipping cost added to totals | FS-0003, RULE-0019 | pending-e2e |
| TEST-0011 | Payment (COD/Free) | select non-card method, submit | order placed; workflow completes; thank-you | FS-0004, RULE-0009/0012 | pending-e2e |
| TEST-0012 | Payment (card authorize) | card method (sandbox) | authorize/capture per config; order persisted on success | FS-0004, RULE-0009 | pending-e2e (sandbox only) |
| TEST-0013 | PayPal Express init | choose PayPal Express | token init + redirect | RULE-0010 | pending-e2e (sandbox) |
| TEST-0014 | Order not persisted on payment failure | force decline | no order saved; error shown | RULE-0012 | pending-e2e (sandbox) |
| TEST-0015 | Display order (thank-you) | complete order | order summary; payment masked | FS-0005, RULE-0014 | pending-e2e |
| TEST-0016 | Order access control | view another customer's order | denied/redirect | RULE-0013 | pending-e2e |
| TEST-0017 | Invoice summary | open invoice summary | line items + totals + supported cards per store | FS-0005, RULE-0020 | pending-e2e |
| TEST-0018 | Register & login | create account, log in | authenticated session | FS-0006 | pending-e2e |
| TEST-0019 | Profile & address CRUD | edit profile/address | persisted | FS-0006 | pending-e2e |
| TEST-0020 | Product review | post review | review tied to product/customer | FS-0006 | pending-e2e |
| TEST-0021 | Digital download auth | download w/o role | access denied; with role → file | FS-0009, RULE-0015 | pending-e2e |
| TEST-0022 | Newsletter subscribe | submit email | captured (PII) | FS-0007 | pending-e2e |
| TEST-0023 | Admin login required | hit `*.action` unauth | redirect to login | FS-0010, RULE-0016 | pending-e2e |
| TEST-0024 | Admin RBAC | access function w/o role | denied | RULE-0017 | pending-e2e |
| TEST-0025 | Admin catalog CRUD | create/edit product | appears in storefront | FS-0011 | pending-e2e |
| TEST-0026 | Admin order/invoice mgmt | view/process order | status changes persist | FS-0012 | pending-e2e |
| TEST-0027 | Admin store/payment/shipping/tax config | configure gateway | credentials stored encrypted | FS-0013/0014, RULE-0018 | pending-e2e |
| TEST-0028 | SOAP service reachable | GET WSDL `/salesManagerInvoiceService` | WSDL returned | FS-0015, SPEC-0041 | pending-e2e |

## Coverage matrix (critical = QA must-cover)

| Area | Tests | Critical |
|------|-------|----------|
| Catalog browse | TEST-0001..0004 | yes |
| Cart | TEST-0005..0008 | yes |
| Checkout/Payment | TEST-0009..0014 | yes |
| Order/Invoice | TEST-0015..0017 | yes |
| Customer | TEST-0018..0022 | partial |
| Admin | TEST-0023..0028 | yes |

## Notes & gaps

- **Payment tests** require gateway **sandbox** credentials; never use live card data (redaction R1–R4). Marked sandbox-only.
- **Inferred rules** (RULE-0004/0019/0021) get characterization tests once confirmed.
- Every TEST links to a REQ/RULE/FS (no orphan tests) — see `00-twin/traceability-matrix.md`.
- Executable suite: `02-reverse/regression-suite/` (Playwright). Runs green (skips E2E) until app URLs are provided.
