# Shopizer v1.1.5

**Date:** 2011-08-14

## Overview

Shopizer is an online sales management software providing:
- Online catalogue
- Shopping cart
- Order fulfillment
- Online invoicing functionalities

This package contains the source code for Shopizer v1.1.5. Building Shopizer will result in 2 web applications packaged in WAR files. A separate web application `media` is included in this package for hosting media files.

## Requirements

### 1. Apache Ant
- **Version:** 1.6 or higher
- **Download:** http://ant.apache.org/

### 2. Sun JDK
- **Version:** 1.5 or higher (or any equivalent JDK)
- **Download JDK 5.0:** http://www.oracle.com/technetwork/java/javase/downloads/index-jdk5-jsp-142662.html

## Build Instructions

### Step 1: Run HSQLDB Database

For testing your installation, you can start the HSQL DB in-memory database already pre-configured in `<SHOPIZER ROOT>/schema/other/hsqldb-memory`. Start the database using:

```bash
startdb.bat
```

You can also install the schema on your HSQLDB, MySQL, or Oracle database by following the instructions in `<SHOPIZER ROOT>/schema/readme.txt`.

### Step 2: Building Media Web Application

```bash
cd <SHOPIZER ROOT>/media
ant
```

A WAR file (`media.war`) will be created in `<SHOPIZER ROOT>/media/dist`.

### Step 3: Configure sm-core-config.properties

Edit `<SHOPIZER ROOT>/sm-core/conf/properties/sm-core-config.properties` and check the following properties:

```properties
core.domain.server=<YOUR HOST>
# Example: localhost:8080

# This is the media bin absolute path for storing branding images, product images and files (js, css, flash...)
# This is the path where you will be dropping your war files
# Example: c:/dev/apache-tomcat-6.0.20/webapps
core.bin.mediapath=<ABSOLUTE DIR TO WAR DIRECTORY>

# This is the absolute path where downloadable files will reside
core.download.path=<ABSOLUTE DIR TO WAR DIRECTORY>/media/download
```

### Step 4: Configure systems.properties

Edit `<SHOPIZER ROOT>/sm-core/conf/properties/systems.properties` and check the following properties:

```properties
database.driver
database.jdbcUrl
database.user
database.password
```

These properties should be adjusted to your database. By default, they are configured for using HSQLDB pre-configured (see Step 1).

**SMTP Configuration:**
An SMTP server should also be available. If there is no possibility for an SMTP server, you can use Gmail server if you have a Gmail account. If so, uncomment the `#Gmail` section and comment the `#Emails` section.

### Step 5: Building sm-central

```bash
cd <SHOPIZER ROOT>/sm-central
ant
```

A WAR file (`sm-central.war`) will be created in `<SHOPIZER ROOT>/sm-central/dist`.

### Step 6: Building sm-shop

```bash
cd <SHOPIZER ROOT>/sm-shop
ant
```

A WAR file (`sm-shop.war`) will be created in `<SHOPIZER ROOT>/sm-shop/dist`.

### Step 7: Deploy

Drop the WAR files generated in `dist` directories (`media.war`, `sm-central.war`, and `sm-shop.war`) into your favorite application server deployment directory.

## Access URLs

- **Administration:** http://&lt;yourhost&gt;:&lt;yourport&gt;/central
- **Catalogue:** http://&lt;yourhost&gt;:&lt;yourport&gt;/shop

## Additional Information

See `shopizer.pdf` for all details on creating a new store.

## Performance Tuning

For best performance, add the following JVM settings:

```
-Xms256m -Xmx256m -XX:MaxPermSize=128m
```

## Support

Thanks for using Shopizer!

**Let us know your appreciation at support@shopizer.com**
