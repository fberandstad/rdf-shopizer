# Functional Q&A Log

**Document**: Software Functional Design for Shopizer  
**Date Started**: October 22, 2025

---

**Questions to Shopizer_Expert**

This file tracks all questions asked to the Shopizer_Expert agent and their responses.

---

---

## Q1: Product Catalog Management Feature Specifications

**Date**: 2025-10-22  
**Status**: ✅ Completed

**Question**: Provide detailed specifications for the Product Catalog Management feature including actors, prerequisites, scenarios, business rules, UI screens, data structures, validation rules, and acceptance criteria.

**Answer Summary**:

- **Actors**: Merchant/Store Admin (primary), Catalog Manager, Inventory Manager, Customer (indirect), System/Integrations
- **Prerequisites**: User authentication, merchant/store context, database schema, media storage configured
- **Scenarios**: Normal (create simple product, create with variants, edit, delete), Alternative (bulk import), Exception (duplicate SKU, missing fields, invalid data)
- **Business Rules**: SKU uniqueness per store, required fields (name, SKU, price), pricing rules (non-negative, currency context), inventory tracking, visibility flags, soft delete preferred
- **Data Structures**: Product entity with ~40+ attributes including id, sku, name, description, price, salePrice, currency, stockQuantity, visibility, images, variants, categories
- **Validation Rules**: SKU (required, unique, 3-64 chars), name (required, &lt;255 chars), price (required, &gt;=0), stock quantity (integer, >=0), image types (JPG/PNG/GIF)
- **Acceptance Criteria**: 15 testable criteria covering create, edit, delete, inventory integration, UI/UX, import/export, security, performance

**Key Files Referenced**:

- sm-core/src/com/salesmanager/core/entity/catalog/Product.java
- sm-central/src/.../catalog/EditProductAction.java
- sm-central/WebContent/catalog/editproduct.jsp
- admin024_description.md

---

## Q2: Shopping Cart and Checkout Feature Specifications

**Date**: 2025-10-22  
**Status**: ✅ Completed

**Question**: Provide detailed specifications for the Shopping Cart and Checkout features including actors, prerequisites, workflows, business rules, checkout steps, payment integration, data structures, error scenarios, and acceptance criteria.

**Answer Summary**:

- **Actors**: Merchant/Store Admin, Registered Customer, Guest Customer, Inventory System, Payment Gateway, System/Scheduler
- **Prerequisites**: Authentication configured, store settings (currency, locale, tax/shipping rules), database schema, HTTPS enabled, payment gateway credentials
- **Workflows**: Guest checkout (7 steps: add to cart → cart page → init checkout → address → shipping → payment → review → place order), Registered checkout (with saved addresses), Cart merge on login
- **Business Rules**: Add item validation (availability, inventory), quantity limits, cart persistence (session + DB), cart expiration (30 days), abandonment detection, coupon validation, pricing snapshots, inventory reservation options
- **Checkout Steps**: Step 0 (init validation), Step 1 (address with validation), Step 2 (shipping method selection), Step 3 (payment with gateway integration), Step 4 (review with re-validation), Step 5 (place order with ACID transaction)
- **Payment Integration**: Redirect gateways (PayPal Express), Direct gateways (card capture), tokenization, authorization/capture flows, webhook/IPN handling, idempotency
- **Data Structures**: Cart entity (id, sessionId, customerId, items, coupons, addresses, totals, status), CartItem (sku, qty, unitPrice, lineTotal), Order entity (orderNumber, customerId, addresses, items, payments, status, totals), OrderItem, PaymentRecord, Address
- **Error Scenarios**: Payment failure (retry with cart intact), insufficient stock (revalidate and adjust), price mismatch (recalculate and confirm), session expired (restore cart), network timeout (idempotency), duplicate submission (idempotency key)
- **Acceptance Criteria**: 15 testable criteria covering cart operations, persistence, merging, checkout validation, payment processing, order creation, security, abandonment, performance

**Key Files Referenced**:

- sm-shop/src/.../checkout/cart/StoreShoppingCartAction.java
- sm-shop/src/.../checkout/flow/InitCheckoutAction.java
- sm-core/src/.../service/order/OrderService.java
- struts-checkout.xml

---

## Q3: Order Management and Payment Processing Feature Specifications

**Date**: 2025-10-22  
**Status**: ✅ Completed

**Question**: Provide detailed specifications for Order Management and Payment Processing features including order lifecycle, fulfillment workflows, payment operations, gateway integrations, invoice management, search capabilities, tracking, refunds, data structures, and error handling.

**Answer Summary**:

- **Order Lifecycle States**: NEW, PENDING_PAYMENT, PAYMENT_AUTHORIZED, PAYMENT_CAPTURED, PROCESSING, PARTIALLY_SHIPPED, SHIPPED, DELIVERED, ON_HOLD, CANCELLED, REFUNDED, PARTIALLY_REFUNDED, FAILED
- **State Transitions**: Cart→NEW→PENDING_PAYMENT→PAYMENT_AUTHORIZED→PAYMENT_CAPTURED→PROCESSING→SHIPPED→DELIVERED, with cancellation and refund paths
- **Fulfillment Workflows**: Standard single-shipment (pick→pack→ship→notify), Partial shipment/backorder, Returns/RMA
- **Payment Operations**: Authorize (hold funds), Capture (complete payment), Sale (auth+capture), Void (cancel auth), Refund (partial/full), Chargeback handling
- **Gateway Integrations**: PayPal (Express/REST redirect), Authorize.Net (AIM/Accept Hosted), Moneris (Hosted PayPage/Direct), using PaymentProvider interface with provider-specific implementations
- **Invoice Management**: Generate on capture, PDF generation, invoice numbering, partial invoicing for shipments, accounting integration
- **Search Capabilities**: Order number, customer name/email, SKU, transaction ID, status, date range, amount range, store, shipping info, full-text search, export to CSV
- **Tracking & Notifications**: Order history events, customer notifications (email/SMS), admin alerts, webhooks for external systems, localized templates
- **Refund/Cancellation**: Pre-capture cancellation (void auth), post-capture cancellation (refund required), partial/full refunds, RMA flow, restocking, credit notes
- **Data Structures**: PaymentRecord (id, orderId, type, provider, amount, status, transactionId, gatewayResponse, cardLast4), TransactionHistory, GatewayWebhookEvent, RefundRecord, Shipment entity
- **Error Handling**: Gateway error mapping, user-friendly messages, retry logic, idempotency keys, transaction atomicity, compensating transactions, daily reconciliation, chargeback handling, monitoring/alerts

**Key Files Referenced**:

- sm-core/src/com/salesmanager/core/service/order/OrderService.java
- sm-central/src/.../orders/EditOrderDetailsAction.java
- sm-central/WebContent/orders/orderdetails.jsp
- sm-core/src/.../payment/PaypalTransactionImpl.java
- sm-core/src/.../payment/BeanStreamTransactionImpl.java

---

## Q4: Data Model and Entity Relationships Specifications

**Date**: 2025-10-22  
**Status**: ✅ Completed

**Question**: Provide comprehensive data model specifications including ERD, data dictionary, database schema, referential integrity, consistency rules, reference data, and archiving policies.

**Answer Summary**:

- **ERD Overview**: Major entities with relationships - Product(1)→(M)SKU, Product(M)→(M)Category, Customer(1)→(M)Order, Order(1)→(M)OrderItem, Order(1)→(M)PaymentRecord, Cart(1)→(M)CartItem, Order(1)→(M)Shipment
- **Core Entities (19 total)**: product, sku, inventory, category, product_category, customer, address, cart, cart_item, order, order_item, payment_record, transaction_log, invoice, shipment, shipment_item, coupon, rma, audit_log
- **Data Dictionary**: Complete field definitions with types - product (product_id BIGINT PK, name VARCHAR(255), default_price DECIMAL(12,2), status ENUM), sku (sku_id, product_id FK, sku_code UNIQUE, unit_price), inventory (available_quantity, reserved_quantity, backorder_allowed), customer (customer_id, email UNIQUE, password_hash, status), order (order_id, order_number UNIQUE, customer_id FK, status, totals), payment_record (payment_id, order_id FK, type ENUM, provider, amount, transaction_id, gateway_response JSON)
- **Schema Details**: Sample DDL with PKs, FKs, indexes - CREATE TABLE patterns for Postgres/MySQL, indexes on search fields (order_number, customer.email, transaction_id, sku_code), generated columns for computed values
- **Referential Integrity**: ON DELETE RESTRICT for financial records (orders, payments, invoices), ON DELETE CASCADE for dependent data (cart_item, order_item), ON DELETE SET NULL for customer anonymization, soft deletes preferred for products/customers
- **Consistency Rules**: DB constraints (NOT NULL, UNIQUE, CHECK qty>=0), application validations (price snapshotting, tax calculation, inventory reservation), concurrency controls (optimistic locking, atomic updates), audit/immutability for financial records
- **Reference Data**: Lookup tables - country, currency, locale, order_status, payment_status, payment_type, shipment_status, invoice_status, tax_class, shipping_method, payment_provider, role/permission
- **Archiving Policies**: Financial data retention (7-10 years per tax law), GDPR compliance (anonymization on request), cart expiration (30 days), partitioning by date, archive to cold storage, scheduled purge jobs with audit trail, backup/disaster recovery procedures

**Key Implementation Notes**:

- Snapshot prices/taxes on order items to preserve historical accuracy
- Use DECIMAL(12,2) for monetary values with currency field
- Store timestamps in UTC
- Implement optimistic locking for inventory to prevent overselling
- Append-only for financial records with history tables
- Multi-store support via store_id on entities

---

## Q5: Security, Authentication, and Authorization Specifications

**Date**: 2025-10-22  
**Status**: ✅ Completed

**Question**: Provide detailed specifications for Security, Authentication, and Authorization including authentication mechanisms, RBAC, session management, input validation, vulnerability protections, PCI DSS compliance, audit logging, API security, and encryption.

**Answer Summary**:

- **Authentication**: JAAS implementation (DatabaseLoginModule, LDAPLoginModule), login flows (username/password, OAuth2/OIDC, SAML SSO), MFA (TOTP), password reset (one-time tokens), remember-me (secure tokens), password policies (12+ chars, Argon2id/bcrypt hashing, account lockout after 5 attempts)
- **Authorization (RBAC)**: Roles (SYSTEM_ADMIN, STORE_ADMIN, CATALOG_MANAGER, ORDER_MANAGER, PAYMENT_MANAGER, CUSTOMER_SUPPORT, WAREHOUSE_USER, FINANCE, AUDITOR, API_CLIENT, CUSTOMER), Permissions (product:create/read/update/delete, order:read/update/cancel/ship/refund, payment:authorize/capture/refund/void), two-level checks (coarse RBAC + fine-grained ABAC)
- **Session Management**: Server-side sessions (Redis for distributed), cookie attributes (Secure, HttpOnly, SameSite=Lax/Strict), session regeneration on login, idle timeout (15-30 min admin, 60-120 min customer), concurrent session limits, token-based for APIs (JWT access tokens 5-15 min, refresh tokens with rotation)
- **Input Validation**: Server-side validation always, whitelist approach, type/length/range/format checks, file upload validation (MIME, size, malware scan), Hibernate Validator/JSR-380, normalization before validation
- **Output Encoding**: Context-aware escaping (HTML, JS, URL, CSS), OWASP Java Encoder, auto-escaping templates (Thymeleaf), parameterized queries for SQL
- **Vulnerability Protections**: SQL injection (prepared statements/ORM), XSS (output encoding, CSP), CSRF (synchronizer tokens, SameSite cookies), SSRF (URL whitelist), IDOR (authorization checks), clickjacking (X-Frame-Options, CSP frame-ancestors), file upload attacks (validation, storage outside webroot)
- **PCI DSS Compliance**: Tokenization (store tokens not PAN), never store CVV/full track data, TLS 1.2+ for cardholder data, network segmentation, MFA for admin access, quarterly ASV scans, annual ROC, secure key management (HSM/KMS), log retention 1 year+
- **Audit Logging**: Events (auth, authorization changes, payments, admin actions, PII access, security failures), structured logs (timestamp UTC, actor_id, action, resource, result), centralized SIEM, tamper-proof storage, retention 1-3+ years, monitoring/alerting (failed logins, unusual refunds, gateway failures)
- **API Security**: OAuth2 (Authorization Code, Client Credentials), scopes, JWT (RS256, short-lived, jti for revocation), mTLS for server-to-server, rate limiting, CORS restrictions, webhook HMAC signatures, API versioning
- **Encryption**: In transit (TLS 1.2+, strong ciphers, HSTS, mTLS for internal), At rest (TDE, column-level for PAN, KMS/HSM for keys, encrypted backups), key rotation, secrets in vault not code
- **Secure SDLC**: SAST (SonarQube), dependency scanning (Snyk), secrets scanning, DAST (ZAP), penetration testing annually, incident response procedures

**Key Implementation Priorities**:

1.  Immediate: TLS everywhere, secure cookies, prepared statements, CSP/X-Frame-Options
2.  Short-term (1-3 mo): MFA for admins, centralized logging/alerting, SAST/dependency scanning in CI
3.  Medium-term (3-6 mo): Tokenization for payments, RBAC fine-grained permissions, secure session management
4.  Long-term: mTLS/service mesh, Argon2 migration, HSM key management, full PCI audit

---