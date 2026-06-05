#!/bin/bash

echo "Starting Tomcat with Java 1.5..."

# Set Java 1.5 environment
export JAVA_HOME=$(pwd)/jdk
export JRE_HOME=$(pwd)/jdk/jre
export CATALINA_HOME=$(pwd)/tomcat
export PATH=$JAVA_HOME/bin:$PATH

# Increase PermGen space for Java 5/6 (as per README.md)
export JAVA_OPTS="-Xms256m -Xmx256m -XX:MaxPermSize=128m"

echo "Using Java version:"
java -version
echo "JAVA_OPTS: $JAVA_OPTS"

echo ""
echo "Starting Tomcat..."
cd tomcat
bin/catalina.sh start

echo ""
echo "Tomcat started. Check logs with: tail -f tomcat/logs/catalina.out"
echo "Access URLs:"
echo "  - Shop: http://localhost:9080/shop/"
echo "  - Central (Admin): http://localhost:9080/central/"
