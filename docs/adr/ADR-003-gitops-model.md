# Title
ADR-003: GitOps model over imperative deployment

# Status
Accepted

# Context
This repository includes infrastructure and deployment artifacts that should remain auditable, reproducible, and easy to review. Imperative deployments (manual CLI steps) can be fast initially, but they create drift risk and reduce visibility into what changed and why. Team collaboration and repeatability are better served when desired state is version-controlled.

# Decision
Adopt a GitOps approach where deployment intent is stored in Git and reconciled by automation, using pull requests and commits as the primary change mechanism. Deployment manifests and operational configuration are treated as code and reviewed alongside application changes.

# Consequences
Benefits: traceable history, peer-reviewed infrastructure changes, and reduced configuration drift. Costs: additional process discipline, slower ad-hoc changes, and reliance on automation tooling health. We accept these costs because consistency, auditability, and reproducibility are prioritized for this project.
