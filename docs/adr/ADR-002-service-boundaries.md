# Title
ADR-002: Separate services instead of a monolith

# Status
Accepted

# Context
The project needs to showcase how independently deployable components interact across languages and runtimes. A monolith would be simpler to run and debug, but would not reflect contract-based communication, service ownership, and operational concerns such as per-service scaling or failure isolation. The repository is intended as a demonstrator for integration patterns, not just feature delivery.

# Decision
Use separate services for distinct domains (apps, services, dependencies) with explicit HTTP interfaces. Keep each service in its own folder with its own runtime, dependencies, and container image, while coordinating them through Docker Compose and shared environment conventions.

# Consequences
Benefits: stronger bounded contexts, clearer ownership, and better demonstration of distributed-system practices. Costs: extra boilerplate, more network/configuration troubleshooting, and potentially higher cognitive load for contributors. We accept this tradeoff because the educational and architectural goals outweigh monolith simplicity.
