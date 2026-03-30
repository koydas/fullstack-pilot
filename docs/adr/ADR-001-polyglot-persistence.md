# Title
ADR-001: Polyglot persistence across MongoDB, PostgreSQL, and SQL Server

# Status
Accepted

# Context
This repository demonstrates a multi-service, multi-runtime architecture rather than a single-stack product. Each service models different data and access patterns: flexible document-style app records, relational service metadata, and enterprise-oriented dependency data. Using only one database would reduce operational surface area, but it would hide important integration tradeoffs and interoperability concerns that this project is meant to expose.

# Decision
Adopt three databases aligned with service boundaries: MongoDB for the Node apps service, PostgreSQL for the Flask services service, and SQL Server for the .NET dependencies service. Each service owns its schema and persistence concerns, and cross-service interactions occur through APIs rather than shared tables.

# Consequences
Benefits: realistic polyglot architecture, clearer ownership, and demonstration of tooling across ecosystems. Costs: higher local setup complexity, more connection/configuration management, and broader maintenance/testing scope. We accept these costs because architectural breadth is a core objective of this repository.
