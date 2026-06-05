#!/bin/bash

echo "Rebuilding Shopizer with Java 1.5..."

# Set Java 1.5 environment
export JAVA_HOME=$(pwd)/jdk
export JRE_HOME=$(pwd)/jdk/jre
export ANT_HOME=$(pwd)/ant
export PATH=$JAVA_HOME/bin:$ANT_HOME/bin:$PATH

echo "Using Java version:"
java -version

# Clean and rebuild sm-core
echo ""
echo "=== Building sm-core ==="
cd sm-core
ant clean
ant
cd ..

# Clean and rebuild sm-central
echo ""
echo "=== Building sm-central ==="
cd sm-central
ant clean
ant
cd ..

# Clean and rebuild sm-shop
echo ""
echo "=== Building sm-shop ==="
cd sm-shop
ant clean
ant
cd ..

echo ""
echo "=== Build complete ==="
echo "WAR files are in dist/ directory"
ls -lh dist/*.war
