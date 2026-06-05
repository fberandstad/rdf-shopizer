# HSQLDB Installation Guide for Shopizer (Linux)

This guide provides step-by-step instructions to set up and initialize the HSQLDB database for the Shopizer e-commerce application on Linux.

## Prerequisites

- **Java Development Kit (JDK)** >= 1.5
- **Apache Ant** >= 1.6
- Linux operating system

## Directory Structure

```
schema/
├── lib/
│   ├── drivers/
│   │   └── hsqldb.jar
│   └── tools/
│       ├── DdlUtils-1.0.jar
│       ├── commons-dbcp-1.2.2.jar
│       ├── commons-pool-1.4.jar
│       ├── commons-logging-1.0.4.jar
│       ├── log4j-1.2.16.jar
│       ├── commons-lang-2.3.jar
│       ├── commons-collections-3.2.jar
│       ├── commons-beanutils-1.7.0.jar
│       ├── jsr173_api.jar
│       └── woodstox.jar
├── other/
│   └── hsqldb-memory/
│       └── startdb.sh
├── sql/
│   └── data/
│       ├── shopizer_data.sql
│       ├── shopizer_merchant_data.sql
│       ├── shopizer_modules.sql
│       └── decotemplates.sql
├── build.properties
├── shopizer-build.xml
└── shopizer-build-hsql.sh
```

## Installation Steps

### 1. Install Required Dependencies

The following JAR files must be present in `schema/lib/tools/`:

```bash
# Copy required dependencies from sm-core/lib to schema/lib/tools/
cd schema
cp ../sm-core/lib/misc/commons-dbcp-1.2.2.jar lib/tools/
cp ../sm-core/lib/misc/commons-pool-1.4.jar lib/tools/
cp ../sm-core/lib/misc/log4j-1.2.16.jar lib/tools/
cp ../sm-core/lib/struts/commons-logging-1.0.4.jar lib/tools/
cp ../sm-core/lib/struts/commons-lang-2.3.jar lib/tools/
cp ../sm-core/lib/struts/commons-collections-3.2.jar lib/tools/
cp ../sm-core/lib/struts/commons-beanutils-1.7.0.jar lib/tools/
cp ../sm-core/lib/jax-ws/jsr173_api.jar lib/tools/
cp ../sm-core/lib/jax-ws/woodstox.jar lib/tools/
```

### 2. Configure Database Properties

Edit `schema/build.properties` and ensure HSQL settings are uncommented:

```properties
db_host=localhost

#HSQL
db_port=9001
db_username=SA
db_password=
salesmanager_db_name=SALESMANAGER
```

**Important Notes:**
- Username must be `SA` (uppercase)
- Password must be empty (no value)
- Database name is `SALESMANAGER`
- Default port is `9001`

### 3. Create HSQLDB Startup Script

Create `schema/other/hsqldb-memory/startdb.sh`:

```bash
#!/bin/bash

# Start HSQLDB server
java -cp ../../lib/drivers/hsqldb.jar org.hsqldb.server.Server --database.0 file:salesmanager --dbname.0 SALESMANAGER
```

Make it executable:

```bash
chmod +x schema/other/hsqldb-memory/startdb.sh
```

### 4. Create Database Build Script

Create `schema/shopizer-build-hsql.sh`:

```bash
#!/bin/bash

echo 'Starting build'

# Set up Java environment
export JAVA_HOME=$(pwd)/../jdk
export JRE_HOME=$(pwd)/../jdk/jre
export CATALINA_HOME=$(pwd)/../tomcat
export ANT_HOME=$(pwd)/../ant
export PATH=$JAVA_HOME/bin:$JRE_HOME/bin:$CATALINA_HOME/bin:$ANT_HOME/bin:$PATH

# Run Ant build
ant -buildfile shopizer-build.xml -Dproperty=build.properties create.data.hsql
```

Make it executable:

```bash
chmod +x schema/shopizer-build-hsql.sh
```

### 5. Start HSQLDB Server

```bash
cd schema/other/hsqldb-memory
./startdb.sh &
cd ../..
```

The server will start on port 9001. You can verify it's running:

```bash
netstat -tuln | grep 9001
# or
ss -tuln | grep 9001
```

Expected output:
```
tcp6       0      0 :::9001                 :::*                    LISTEN
```

### 6. Create Database Schema and Load Data

```bash
cd schema
./shopizer-build-hsql.sh
```

This will:
1. Create the database schema (90 tables)
2. Load initial data from:
   - `sql/data/shopizer_data.sql`
   - `sql/data/shopizer_merchant_data.sql`
   - `sql/data/shopizer_modules.sql`
   - `sql/data/decotemplates.sql`

Expected output:
```
BUILD SUCCESSFUL
Total time: 1 second
```

With the message:
```
2124 of 2124 SQL statements executed successfully
```

## Database Management

### Stop HSQLDB Server

```bash
pkill -f "org.hsqldb.server.Server"
```

### Clean Database (Fresh Start)

To completely reset the database:

```bash
# Stop the server
pkill -f "org.hsqldb.server.Server"

# Remove database files
cd schema/other/hsqldb-memory
rm -f salesmanager.lck salesmanager.log salesmanager.properties salesmanager.script salesmanager.data salesmanager.backup

# Restart server
./startdb.sh &
cd ../..

# Rebuild database
./shopizer-build-hsql.sh
```

### Check Server Status

```bash
# Check if server is running
ps aux | grep hsqldb

# Check listening port
ss -tuln | grep 9001
```

## Connection Details

- **JDBC URL:** `jdbc:hsqldb:hsql://localhost:9001/SALESMANAGER`
- **Driver Class:** `org.hsqldb.jdbcDriver`
- **Username:** `SA`
- **Password:** (empty)
- **Database Name:** `SALESMANAGER`

## Troubleshooting

### Build Fails with "NoClassDefFoundError"

**Problem:** Missing JAR dependencies in `lib/tools/`

**Solution:** Ensure all required JAR files are copied as described in Step 1.

### Connection Refused Error

**Problem:** HSQLDB server is not running

**Solution:**
```bash
cd schema/other/hsqldb-memory
./startdb.sh &
```

### Invalid Authorization Specification

**Problem:** Incorrect username or password in `build.properties`

**Solution:** Verify credentials:
- Username: `SA` (uppercase)
- Password: (empty/blank)

### Integrity Constraint Violation

**Problem:** Database already contains data

**Solution:** Clean the database as described in "Clean Database (Fresh Start)" section.

### Port Already in Use

**Problem:** Port 9001 is already occupied

**Solution:**
```bash
# Find process using port 9001
lsof -i :9001

# Kill the process or change port in build.properties
```

## Database Files Location

Database files are stored in:
```
schema/other/hsqldb-memory/
├── salesmanager.lck       # Lock file (server running)
├── salesmanager.log       # Transaction log
├── salesmanager.properties # Database properties
├── salesmanager.script    # Schema and data
└── salesmanager.data      # Additional data (if exists)
```

## Next Steps

After successful installation:

1. Update `sm-core/conf/properties/systems.properties` to use HSQLDB
2. Rebuild `sm-central` and `sm-shop` web applications
3. Deploy to Tomcat server

## Additional Resources

- HSQLDB Documentation: http://hsqldb.org/doc/
- Shopizer Project: https://www.shopizer.com/
