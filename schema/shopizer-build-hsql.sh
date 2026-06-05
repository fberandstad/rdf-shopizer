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