# Shopizer v1 - E-commerce Platform

## Overview

Shopizer v1 is a comprehensive Java-based e-commerce platform designed to provide both customer-facing storefront functionality and administrative management capabilities. The application follows a multi-module architecture and is built using enterprise Java technologies.

## License

The application is distributed under the GNU Lesser General Public License (LGPL) version 3.

## Architecture

### Multi-Module Structure

The application is organized into four main modules:

1. **sm-core** - Core business logic and entity definitions 
2. **sm-central** - Administrative web application
3. **sm-shop** - Customer-facing storefront web application
4. **schema** - Database schema and setup scripts

### Technology Stack

The platform leverages several enterprise Java technologies:

- **Struts 2** - Web application framework
- **Hibernate** - Object-relational mapping
- **Spring Framework** - Dependency injection and configuration
- **Apache Tiles** - Layout management
- **JAX-WS** - Web services support

## Core Components

### Business Entities

The core module contains comprehensive business entities organized by domain:

- **Catalog Management** - Products, categories, pricing, and reviews
- **Order Management** - Shopping cart, orders, and order processing
- **Customer Management** - Customer accounts and profiles
- **Merchant Operations** - Store configuration and management
- **Payment Processing** - Payment gateway integrations
- **Shipping & Tax** - Logistics and tax calculations

### Service Layer

The platform implements a comprehensive service layer with dedicated services for each business domain:

- Catalog services
- Order management services  
- Customer services
- Payment processing services
- Shipping and tax services
- System and reference data services

## Database Support

The platform supports multiple database systems:

- **MySQL** - Primary recommended database
- **Oracle** - Enterprise database support
- **HSQLDB** - Development and testing database

## Web Applications

### Administrative Interface (sm-central)

The central administration application provides comprehensive management capabilities for:

- Store configuration and settings
- Product catalog management
- Order processing and fulfillment
- Customer account management
- Payment and shipping configuration
- Tax management
- Reporting and analytics

The admin interface includes security features with custom authentication filtering.

### Customer Storefront (sm-shop)

The shop application provides the customer-facing e-commerce functionality including:

- Product browsing and search
- Shopping cart management
- Customer account creation and management
- Checkout and payment processing
- Order tracking and history

## Development and Deployment

### Build System

The platform uses Apache Ant for build automation with dedicated build scripts for each module.

### Requirements

- **JDK 1.5 or higher**
- **Apache Ant 1.6 or higher**
- **Servlet container** (for web application deployment)
- **Database server** (MySQL, Oracle, or HSQLDB)

### Documentation

The platform includes automated API documentation generation using Javadoc for core packages.

## Notes

Shopizer v1 represents a mature Java e-commerce platform with enterprise-grade architecture and comprehensive functionality. The multi-module design separates concerns effectively, with the core module containing business logic and entities, while separate web applications handle administration and customer-facing operations. The platform's flexibility in database support and extensive configuration options make it suitable for various e-commerce scenarios.
