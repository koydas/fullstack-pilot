# GitOps layout

Service-specific Kubernetes and Argo CD manifests live under `services/<service>/.devops`.
Each folder provides:

- `kustomization.yaml` with the deployment, service, and supporting resources for the component.
- `application.yaml` so the service can be registered in Argo CD and synced from this repository.

## Bootstrap steps

1. Apply the Argo CD Application for the service:
   ```bash
   kubectl apply -f services/server/.devops/application.yaml
   kubectl apply -f services/client/.devops/application.yaml
   ```
2. Update the container image references as needed (for example via Kustomize image overrides or Argo CD parameters).
3. Configure secrets such as `MONGODB_URI` with the values for your cluster before promoting beyond development.

Both services default to the shared `fullstack-pilot` namespace and expose `/api` through the backend and `/` through the frontend Ingress host `fullstack-pilot.local`.
