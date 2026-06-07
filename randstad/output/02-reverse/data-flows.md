# Data Flows — Shopizer v1.1.5

**Owner:** `software-architect`  **Stage:** 2  **Generated:** 2026-06-06

> Flows reconstructed from local source + CAST transaction traces (`docs/Application
> Architecture (CAST -powered)/Transaction : *.md`). DB table names as reported by
> CAST (MySQL schema names). Each flow carries a `DF-####` id.

## DF-0001 — Add to cart (mini cart)

```mermaid
sequenceDiagram
    participant U as Shopper
    participant A as MiniShoppingCartAction
    participant CS as CatalogService
    participant DAO as ProductDao
    participant DB as RDBMS
    U->>A: /addToCart (productId, qty, attrs)
    A->>A: addProductToCart()
    A->>CS: getProduct() / getProductAttributes()
    CS->>DAO: findById() / findAttributesByIds()
    DAO->>DB: SELECT PRODUCTS / PRODUCTS_ATTRIBUTES
    DB-->>A: product + attributes
    A-->>U: updated mini-cart (JSON/HTML)
```
Source: CAST addToCart §2.1 (Tx 335326); `com.salesmanager.catalog.cart.MiniShoppingCartAction`.

## DF-0002 — Add to cart (checkout cart) + totals

```mermaid
sequenceDiagram
    participant U as Shopper
    participant A as ShoppingCartAction
    participant T as Tax/PricingService
    participant CFG as MerchantConfiguration
    participant DB as RDBMS
    U->>A: /addToCart
    A->>A: assembleItems() -> updateOrderTotal()
    A->>T: calculateTotal -> calculateOrderTotal -> calculateTax
    T->>CFG: getConfigurationVO -> getConfiguration (decrypt SecretKeySpec)
    CFG->>DB: SELECT MERCHANT_CONFIGURATION
    DB-->>A: totals (subtotal, tax, total)
    A-->>U: cart view
```
Source: CAST addToCart §2.2 (Tx 335335). Tables: `MERCHANT_CONFIGURATION`, `MERCHANT_STORE`, `PRODUCTS`, `PRODUCT_RELATIONSHIP`, `DYNAMIC_LABEL`. Server recomputes prices (never trusts client) — see RULE-0007.

## DF-0003 — Checkout / place order (workflow)

```mermaid
sequenceDiagram
    participant U as Shopper
    participant CO as ComitOrderAction
    participant WF as OrderWorkflowProcessor
    participant PM as PaymentModule
    participant PG as Payment Gateway
    participant DB as RDBMS
    participant M as EmailUtil/SMTP
    U->>CO: submit order
    CO->>WF: orderWorkflow.run()
    WF->>WF: processCustomer
    WF->>PM: processPayment -> processTransaction()
    PM->>PG: authorize / capture / sale
    PG-->>PM: auth result
    WF->>DB: processOrder / saveOrder (INSERT ORDERS, ORDER_PRODUCT)
    WF->>M: sendConfirmationEmail
    CO-->>U: redirect to displayOrder (thank-you)
```
Source: `sm-core-workflow-beans.xml:21-46`; `PaymentModule.java:38-67`; `ComitOrderAction`.

## DF-0004 — Display order (thank-you / profile)

```mermaid
graph TD
    A[displayOrder / ComitOrderAction] --> OS[getOrder OrderService]
    A --> CSv[getProduct CatalogService]
    A --> DL[getOrderProductDownloads]
    OS --> ODao[findById OrderDao] --> SO[SELECT ORDERS]
    CSv --> PDao[findById ProductDao] --> SP[SELECT PRODUCTS]
    DL --> DDao[findByOrderId] --> SD[SELECT ORDERS_PRODUCTS_DOWNLOAD]
```
Source: CAST displayOrder (Tx 335341). Payment/transaction id displayed **masked** (RULE-0014). Auth: customer must own order, or admin (RULE-0013).

## DF-0005 — Invoice summary

```mermaid
graph TD
    J[/invoiceSummary or invoiceSummary.jsp/] --> D[displayOrderSummaryAction]
    D --> UOT[updateOrderTotal] --> COT[calculateOrderTotal] --> CT[calculateTax]
    D --> CFG[getConfigurationVO -> MERCHANT_CONFIGURATION]
    D --> PM[prepareCreditCards -> getPaymentMethods -> getSupportedCreditCards]
    D --> CO[findByIsoCode -> COUNTRIES]
    J --> PR[printInvoice -> invokeGetUrl -> HttpURLConnection ext]
```
Source: CAST invoiceSummary (Tx 335344 Struts; Tx 335621 JSP). External HTTP call on print path. Tables: `MERCHANT_CONFIGURATION`, `MERCHANT_STORE`, `COUNTRIES`, `DYNAMIC_LABEL`.

## DF-0006 — Admin authentication

```mermaid
sequenceDiagram
    participant Admin
    participant F as CustomAuthFilter
    participant S as Struts2 (*.action)
    Admin->>F: request *.action
    F->>F: check session / role (MerchantUserRole)
    alt authorized
        F->>S: forward
    else
        F-->>Admin: redirect to login
    end
```
Source: `sm-central/.../web.xml:11-19`; roles in `MerchantUserRole*.hbm.xml`, `CentralGroup.hbm.xml`.

## Key persistent entities touched

`PRODUCTS`, `PRODUCTS_ATTRIBUTES`, `PRODUCT_RELATIONSHIP`, `ORDERS`, `ORDER_PRODUCT`, `ORDERS_PRODUCTS_DOWNLOAD`, `MERCHANT_CONFIGURATION`, `MERCHANT_STORE`, `MERCHANT_USER_INFORMATION`, `COUNTRIES`, `DYNAMIC_LABEL`, `CUSTOMER`, `CREDIT_CARD`. (CAST traces + `sm-core/conf/hibernate/*.hbm.xml`.)

## Sensitive-data flows (for security/compliance, Stage 3)

- **Card data:** checkout → `CreditCardUtil` → `EncryptionUtil` (JCE `SecretKeySpec`) → gateway (`*TransactionImpl`). Metadata-only in Twin (see `00-twin/redaction-log.md`).
- **PII:** customer registration/profile → `Customer`/`CustomerInfo` tables.
- **Config secrets:** `MERCHANT_CONFIGURATION` stores encrypted gateway credentials (decrypt at use).
