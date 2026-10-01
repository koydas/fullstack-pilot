# Title
ADR-004: Track latest dependency versions

# Status
Accepted

# Context
The repository spans several dependency ecosystems: npm (`client`, `services/*`, root), pip (`services/services-service`), NuGet (`services/dependencies-service`), Docker base images, and GitHub Actions. Only Dependabot security updates were active, so upgrades arrived reactively, one CVE at a time. Pull requests accumulated, conflicted with each other on lockfiles, and major versions (for example Express 4 → 5) were left open as optional, which makes the eventual migration larger and riskier the longer it is deferred.

# Decision
Every dependency is kept on its latest stable release, major versions included.

- Version updates are automated for every ecosystem in the repository (Dependabot version updates in `.github/dependabot.yml`), in addition to security updates.
- Major version bumps are migrated, not ignored: the pull request is completed with the required code changes and tests covering any behavior change, then merged.
- A dependency may be held back only when no compatible migration path exists yet (for example an unreleased upstream fix). The exception is recorded in `.github/dependabot.yml` next to the `ignore` rule, with the reason and the condition for removing it.
- Pre-release versions (alpha, beta, rc) are out of scope.
- CI tests each service on the runtime version its Dockerfile ships (Node, Python, .NET), resolved by `.devops/runtime-version.js` and enforced by `.devops/tests/consistency/runtime-versions.test.js`. An image bump is therefore tested on the new runtime by its own pull request.
- Upgrades that only work together land together: coupled packages and images are grouped in `.github/dependabot.yml` (for example react with react-dom, EF Core packages, the `dotnet/*` images). When an update is still split, or also needs code or configuration changes (for example a `TargetFramework` bump), the split pull requests are closed in favor of one migration pull request that references them.
- Database images follow ADR-005: a major that changes the data format ships with a tested data migration.

# Consequences
Benefits: security fixes land without back-porting, migrations stay small and incremental, and lockfile conflicts between stale update pull requests are avoided. Costs: a steady stream of update pull requests to review (code owner review is required), and regular migration work on major releases that would otherwise be postponed. We accept these costs because a continuously current stack is cheaper to maintain than periodic large upgrades.
