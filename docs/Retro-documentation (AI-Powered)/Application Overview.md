# Application Overview

**Version:** 1.0 | **Date:** October 22, 2025 | **Platform:** Shopizer v1.x

---

## 1\. Platform Introduction

### 1.1 Overview

Shopizer is an **open-source, Java-based e-commerce platform** designed to provide organizations with complete control over their online store infrastructure. Built on enterprise Java technologies, it serves as both a production-ready e-commerce solution and a reference implementation for Java-based e-commerce patterns. The platform targets small-to-medium businesses, enterprise organizations, and development teams requiring self-hosted, customizable e-commerce capabilities without vendor lock-in.

**Platform Statistics:**

- **Codebase:** 136,828 lines of code across 4 modules
- **Architecture:** 1,930 service objects, 302 integration points, 111 data services
- **Performance:** 100-400 RPS per node, 99.95% availability target
- **Scalability:** Horizontal scaling with stateless design and distributed sessions

### 1.2 Strategic Business Objectives

1.  **Reduce Total Cost of Ownership** - Open-source licensing eliminates vendor fees and lock-in
2.  **Accelerate Time-to-Market** - Production-ready solution reduces development from months to weeks
3.  **Enable Business Scalability** - Multi-store support allows expansion without proportional infrastructure costs
4.  **Ensure Enterprise Integration** - Well-defined service layers enable seamless ERP/CRM integration
5.  **Maximize Customization Flexibility** - Code-level control enables unique business requirements
6.  **Mitigate Technology Risk** - Mature Java technologies ensure maintainability and available talent

### 1.3 Key Stakeholders

- **Merchants/Store Owners** - Manage product catalogs, pricing, inventory, and store configuration
- **Store Administrators** - Process orders, handle customer service, maintain content
- **Developers/Integrators** - Customize platform, develop themes, implement integrations
- **End Customers** - Browse products, complete purchases, manage accounts
- **Operations Teams** - Deploy, monitor, and maintain infrastructure

---

## 2\. Technical Architecture

### 2.1 Modular Architecture

Shopizer employs a **modular, layered architecture** with four primary deployable modules:

#### **. sm-core (Core Business Logic)**

- Domain model and business services
- Data Access Objects (DAOs) with Hibernate ORM
- Service layer: OrderService, CatalogService, PaymentService, ShippingService, TaxService
- Integration modules for payment gateways and shipping providers
- Web services implementations (SOAP/JAX-WS)
- Shared utilities for encryption, session management, file handling

#### **. sm-shop (Customer Storefront)**

- Customer-facing web application (Struts 2 + JSP)
- Product catalog browsing and search
- Shopping cart management (session-based and persistent)
- Multi-step checkout workflow
- Customer account management and order history
- Packaged as `sm-shop.war`

#### **. sm-central (Administrative Console)**

- Back-office web application for merchants (Struts 2 + JSP)
- Merchant dashboard with key metrics
- Product and category management
- Order processing and fulfillment
- Store configuration and settings
- User and role management
- Reporting and analytics
- Packaged as `sm-central.war`

#### **. schema (Database Module)**

- SQL scripts for MySQL, Oracle, HSQLDB
- Table definitions, constraints, indexes
- Seed data and initial configuration

### 2.2 Technology Stack

**. Core Technologies:**

- **Java Platform:** JDK 1.5+ (recommended Java 8/11 for production)
- **Web Framework:** Struts 2.x for MVC pattern
- **Dependency Injection:** Spring Framework 2.5/3.0+
- **Persistence:** Hibernate 3.x with JPA annotations
- **Build Tool:** Apache Ant 1.6+
- **Application Server:** Tomcat 6.x/7.x/8.5/9.x, JBoss AS 5/6

**. Supporting Technologies:**

- **Presentation:** JSP, Apache Tiles, Direct Web Remoting (DWR), jQuery
- **Caching:** OSCache for application-level caching
- **Search:** Hibernate Search with Lucene integration
- **Database:** MySQL 5.7/8.0, Oracle 12c/19c, HSQLDB (development)
- **Connection Pooling:** C3P0 or HikariCP

### 2.3 Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (Struts 2 Actions + JSP Views)     │
├─────────────────────────────────────────────────────────┤
│  Service Layer (Spring-managed Business Services)      │
├─────────────────────────────────────────────────────────┤
│  Integration Layer (Payment/Shipping Modules, SOAP)    │
├─────────────────────────────────────────────────────────┤
│  Data Access Layer (Hibernate DAOs)                    │
├─────────────────────────────────────────────────────────┤
│  Cross-Cutting (Spring DI, JAAS Security, OSCache)     │
└─────────────────────────────────────────────────────────┘
```

**. Key Architectural Patterns:**

- **MVC Pattern** - Struts 2 separates presentation from business logic
- **Service Layer Pattern** - Business logic encapsulated in Spring-managed services
- **DAO Pattern** - Hibernate abstracts persistence operations
- **Dependency Injection** - Spring manages component lifecycle and dependencies
- **Transaction Management** - Spring declarative transactions ensure ACID compliance

---

## 3\. Core Functional Capabilities

### 3.1 Product Catalog Management

- Product creation with rich attributes (name, description, price, SKU)
- Category hierarchy and product-to-category relationships
- Product variants and options (size, color, material)
- Product images and media galleries
- Inventory tracking and stock levels
- Product visibility and availability controls
- Related products and cross-sell/upsell relationships
- Full-text search with Lucene/Hibernate Search

### 3.2 Shopping & Checkout

- **Shopping Cart:** Session-based (guests) and persistent (registered customers)
- **AJAX Mini-Cart:** Real-time updates without page refresh
- **Multi-Step Checkout:** Streamlined workflow with progress indicators
- **Guest Checkout:** Purchase without registration
- **Address Management:** Shipping and billing address collection
- **Shipping Selection:** Multiple methods with real-time rate calculation
- **Payment Processing:** Multiple gateway support with secure handling
- **Order Review:** Final confirmation before purchase

### 3.3 Order Management

- **Order Lifecycle:** NEW → PAID → SHIPPED → COMPLETED → CANCELLED
- Order status tracking and updates
- Order search and filtering
- Invoice generation and management
- Payment capture and refund processing
- Shipment tracking and fulfillment
- Order history for customers and merchants
- Email notifications at each stage

### 3.4 Payment & Shipping Integration

**. Payment Gateways:**

- PayPal Express Checkout (REST API)
- Authorize.Net (AIM/Accept Hosted)
- Moneris (Hosted PayPage/Direct Post)
- Pluggable architecture for additional gateways
- Transaction logging and audit trails
- Refund and void operations

**. Shipping Providers:**

- Configurable shipping methods (flat rate, custom rates)
- Carrier integrations (FedEx rate quotes, USPS, UPS)
- Shipping rate calculation based on weight, destination, price
- Shipping zone configuration
- Real-time rate quotes from carriers

### 3.5 Tax Calculation

- Regional tax rules and rate management
- Tax zone configuration
- Multi-jurisdiction tax support
- Tax calculation based on shipping destination
- Product tax class assignment
- Automatic recalculation on address changes

### 3.6 Customer Management

- Customer registration and authentication (JAAS)
- Profile management (contact info, preferences)
- Address book (multiple shipping/billing addresses)
- Order history with detailed views
- Password reset and account recovery
- Customer groups and segmentation
- Customer search and filtering in admin

### 3.7 Multi-Store Support

- Multiple independent merchant stores from single installation
- Store-specific configurations (name, currency, locale)
- Independent product catalogs and pricing per store
- Separate branding and themes
- Store-scoped user and role management
- Centralized platform administration

### 3.8 Content & Internationalization

- Static page creation and editing
- Content blocks and portlets
- Homepage carousel management
- SEO metadata management
- Multi-language support with locale-specific content
- Multi-currency pricing and display
- Localized date and number formatting

---

## 4\. Data Architecture

### 4.1 Core Data Entities

**. Products:**

- Product catalog with variants, attributes, categories, pricing
- Product images and media management
- Inventory levels and availability tracking

**. Customers:**

- Customer accounts, profiles, addresses
- Authentication data and preferences
- Customer groups and segmentation

**. Orders:**

- Order lifecycle, line items, payments
- Fulfillment tracking and shipment records
- Order totals (subtotal, tax, shipping, discounts)

**. Merchants:**

- Store configurations and settings
- Payment and shipping method configurations
- Administrative settings and branding

**. Categories:**

- Hierarchical product organization
- Category descriptions and metadata
- Navigation structure

### 4.2 Database Support

- **MySQL 5.7/8.0** - Primary production database (InnoDB)
- **Oracle 12c/19c** - Enterprise database option
- **HSQLDB** - Development and testing (not for production)

**. Design Principles:**

- Normalized schema with referential integrity
- Hibernate ORM mappings (.hbm.xml)
- Soft deletes for order history preservation
- Audit trails for critical operations
- Multi-tenant support for multiple stores

---

## 5\. Non-Functional Requirements

### 5.1 Performance

- **Response Time:** ≤800ms cached pages, ≤2s dynamic pages
- **Throughput:** 1,000+ concurrent users, 100 transactions/minute peak
- **Scalability:** Horizontal scaling with load balancer, database read replicas
- **Optimization:** Application caching (OSCache), HTTP caching, CDN for static assets

### 5.2 Security

- **Authentication:** JAAS-based with strong password policies
- **Authorization:** Role-Based Access Control (RBAC)
- **Data Protection:** HTTPS/TLS required, secure session cookies
- **Payment Security:** PCI DSS compliance, tokenization (no raw PAN storage)
- **Input Validation:** Server-side validation, parameterized queries, XSS prevention
- **CSRF Protection:** Token-based protection for state-changing operations

### 5.3 Availability

- **Uptime:** 99.9% storefront, 99.5% admin interface
- **MTBF:** ≥720 hours
- **MTTR:** ≤30 minutes for critical issues
- **Backup:** Daily automated backups, 30-day retention
- **High Availability:** Multiple app servers, database replication, automated failover

### 5.4 Compatibility

- **Browsers:** Chrome, Firefox, Safari, Edge (modern versions)
- **Java:** JDK 1.5+ (recommend Java 8/11 LTS)
- **Databases:** MySQL 5.x+, Oracle 10g+, HSQLDB
- **App Servers:** Tomcat 6.x+, JBoss/WildFly
- **OS:** Linux (Ubuntu, CentOS, RHEL), Windows Server

---

## 6\. Key Business Rules

1.  **Product Visibility** - Products must be explicitly marked visible to appear on storefront
2.  **Inventory Management** - Stock decremented on order confirmation; backorders require explicit enablement
3.  **Pricing Calculation** - Base price + promotions + regional tax + currency conversion
4.  **Order Lifecycle** - Controlled state transitions (NEW → PAID → SHIPPED → COMPLETED)
5.  **Payment Authorization** - Required before order confirmation; capture may be deferred
6.  **Tax Calculation** - Based on shipping destination, product tax class, configured rules
7.  **Shipping Calculation** - Based on method, destination, weight/dimensions, order value
8.  **Customer Authentication** - Guest checkout allowed; registration required for account features
9.  **Data Integrity** - Referential integrity enforced; soft deletes for order history
10. **Multi-Store Isolation** - Independent operations with separate configurations and data

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** Final  
**Classification:** Internal Use