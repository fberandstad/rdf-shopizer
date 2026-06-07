# Business Rules — Shopizer v1.1.5

**Owner:** `business-analyst`  **Stage:** 2  **Generated:** 2026-06-06
**Schema:** `RULE-#### | description | condition | action | source-file:line` (SPECS.md §9)

> Rules recovered from cart/checkout/payment logic and CAST traces. Where a rule is
> inferred from behavior rather than an explicit code line, it is marked **(inferred)**
> and flagged for confirmation during detailed design / QA.

| RULE | Description | Condition | Action | Source |
|------|-------------|-----------|--------|--------|
| RULE-0001 | Product must exist & be enabled for store before add | productId/sku resolves and enabled for current store | else reject add, show error | CAST addToCart §1.3,§1.5; `ShoppingCartAction` |
| RULE-0002 | Required product attributes must be provided/valid | item has required options | else reject add | CAST addToCart §1.5.3 |
| RULE-0003 | Quantity must be a positive integer | qty > 0 | else reject; no negative qty | CAST addToCart §1.8 |
| RULE-0004 | Stock availability checked on add (if enforcement enabled) | StockService says available | else error or cap to available | CAST addToCart §1.5.3 (inferred) |
| RULE-0005 | Same SKU + same option set merges into one line | matching cart item exists | increase quantity instead of new line | CAST addToCart §1.5.4 |
| RULE-0006 | Cart held in session; persisted for logged-in users | authenticated user | persist/merge cart to DB | CAST addToCart §1.6; `CustomerBasket.hbm.xml` |
| RULE-0007 | Prices/totals always recomputed server-side | any cart/checkout pricing | ignore client-supplied prices; use SKU price + PricingService | CAST addToCart §1.8; invoiceSummary §1.8 |
| RULE-0008 | Checkout requires customer context | placing order | run `processCustomer` before payment | `sm-core-workflow-beans.xml:24` |
| RULE-0009 | Payment processed per merchant config mode | card payment | authorize / capture / authorizeAndCapture | `PaymentModule.java:38-51` |
| RULE-0010 | PayPal Express uses token init flow | gateway = PayPal Express | `initTransaction` returns token; redirect | `PaymentModule.java:53-63`; `PayPalExpressCheckoutAction` |
| RULE-0011 | External-server payments finalized on return | payment on external server | `postTransaction(order)` | `PaymentModule.java:65-66` |
| RULE-0012 | Order persisted only after successful workflow steps | orderWorkflow completes | `processOrder`/`saveOrder` then confirmation email | `sm-core-workflow-beans.xml:21-46` |
| RULE-0013 | Order viewable only by owner or admin | requester = order's customer OR admin | else deny/redirect | CAST displayOrder §1.3; invoiceSummary §1.8 |
| RULE-0014 | Payment/transaction id shown masked | displaying order/invoice | mask sensitive payment data | CAST displayOrder §1.5,§1.7 |
| RULE-0015 | Product digital download requires role | download product file | `@PreAuthorize` role `PRODUCTS` | `FilesController` doc; `FilesAction` |
| RULE-0016 | Admin endpoints require authentication | request `*.action` (central) | `CustomAuthFilter` enforces session | `sm-central/.../web.xml:11-19` |
| RULE-0017 | Admin authorization by role/function | admin action requested | check `MerchantUserRole`/`CentralFunction` | `MerchantUserRole*.hbm.xml`, `CentralFunction.hbm.xml` |
| RULE-0018 | Gateway credentials stored encrypted | save merchant config | encrypt via `EncryptionUtil`; decrypt at use (`SecretKeySpec`) | CAST addToCart §2.2 crypto path; `EncryptionUtil.java` |
| RULE-0019 | Tax computed by geo-zone template | order has shipping zone | `calculateTax` per `GeoZoneTaxTemplate` | CAST §2.2; `GeoZoneTaxTemplate.hbm.xml` (inferred) |
| RULE-0020 | Supported credit cards are per-store | render payment options | `getSupportedCreditCards` for store | CAST invoiceSummary §2.1 |
| RULE-0021 | Store context isolation (no cross-store data) | any store-scoped request | validate `storeCode`/merchant context | CAST invoiceSummary §1.8 (inferred) |
| RULE-0022 | Confirmation email sent on order completion | workflow reaches `sendConfirmationEmail` | send via SMTP/`EmailUtil` | `sm-core-workflow-beans.xml:27,46` |

## Notes
- **Inferred** rules (0004, 0019, 0021) require code confirmation in detailed design (Stage 3) and are candidate characterization tests (Stage 2 QA).
- Sensitive-data rules (0014, 0018) feed Stage 3 `security-analyst` / `compliance-analyst`.
- All RULE ids are linked in `00-twin/traceability-matrix.md` to FS-/REQ- and (Stage 2) TEST- ids.
