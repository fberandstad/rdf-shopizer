# Application Architecture (CAST -powered)

# Cast Imaging Tools Classification

We have organized the Cast Imaging tools into **6 main categories** plus a utility function:

1.  **Application Overview** (8 tools) - High-level application information, architecture, dependencies, and stats
2.  **Transaction Overview** (9 tools) - Transaction analysis, graphs, and documentation
3.  **Data Graph Analysis** (9 tools) - Data entity interaction networks and their analysis
4.  **Code Quality & Security** (4 tools) - CVE, security issues, package management, quality insights
5.  **Code Object & Source Analysis** (5 tools) - Object-level code inspection and source file analysis
6.  **Database Explorer** (1 tool) - Database schema exploration

The classification groups tools by their primary purpose while maintaining clear separation between transaction flows, data flows, and code structure analysis.

## 1\. Application Overview

- **applications** - Available applications with Imaging server (paginated)
- **applications_dependencies** - Inter-dependencies for all applications
- **applications_quality_insights** - Quality insights for all applications
- **stats** - Basic stats for an application
- **architectural_graph** - Architectural graph at specific levels (layer, component, sub-component, technology-category, element-type)
- **architectural_graph_focus** - Architectural graph focused on specific area
- **inter_applications_dependencies** - Inward/outward inter-application dependencies
- **inter_app_detailed_dependencies** - Detailed dependencies between applications

## 2\. Transaction Overview

- **applications_transactions** - Transactions from all applications (filterable)
- **transactions** - Transactions for an application (filterable)
- **transaction_objects_with_insights** - Objects with insights in a transaction
- **transaction_complex_objects** - Complex objects in a transaction
- **transaction_documents** - Documents for a transaction
- **add_transaction_document** - Add document to a transaction
- **transaction_graph** - Nodes/links at selected granularity of a transaction
- **transaction_graph_focus** - Reduced graph focused on most complex objects
- **transactions_using_object** - Transactions using specific object(s)

## 3\. Data Graph Analysis

- **applications_data_graphs** - Data entity interaction networks from all applications (filterable)
- **data_graphs** - Data graphs for an application (filterable)
- **data_graph_objects_with_insights** - Objects with insights in a data graph
- **data_graph_complex_objects** - Complex objects in a data graph
- **data_graph_documents** - Documents for a data graph
- **add_datagraph_document** - Add document to a data graph
- **data_graph_graph** - Nodes/links at selected granularity of a data graph
- **data_graph_graph_focus** - Reduced graph focused on most complex objects
- **data_graphs_involving_object** - Data graphs involving specific object(s)

## 4\. Code Quality & Security

- **quality_insights** - Quality-related insights (CVE, cloud blockers, green deficiencies, structural flaws, ISO-5055)
- **quality_insight_occurrences** - Occurrences of targeted quality insights
- **packages** - Packages for an application
- **package_interactions** - Interactions with packages

## 5\. Code Object & Source Analysis

- **objects** - Objects matching identification criteria (filterable)
- **object_details** - Detailed object information (properties, flows, usage, code snippet)
- **add_object_document** - Add document to a code element/object
- **source_files** - Find files defining code objects (path matching)
- **source_file_details** - Details about source file (inventory, intra, inward, outward, testing dependencies)

## 6\. Database Explorer

- **application_database_explorer** - Explore database tables and columns (list tables, filter, get columns, pagination)

## Utility

- **fallback_irrelevant** - Fallback for out-of-scope queries

---