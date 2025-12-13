# Deployment assets

This folder collects deployment-ready configuration for FullStack Pilot:

- `docker-compose.yml` for running the stack locally or in a single host setup.
- `gitops/` for Argo CD Applications that point at the Kubernetes manifests under `services/<service>/.devops`.

## Argo CD bootstrap

Apply the Applications to let Argo CD track the client, apps-service, and server manifests from this repository:

```bash
kubectl apply -f deploy/gitops/server-application.yaml
kubectl apply -f deploy/gitops/client-application.yaml
kubectl apply -f deploy/gitops/apps-service-application.yaml
```

Each Application tracks the `main` branch and uses `CreateNamespace=true` so the `fullstack-pilot` namespace is created when syncing.
