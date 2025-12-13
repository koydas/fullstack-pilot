# GitOps layout

Service-specific Kubernetes manifests live under `services/<service>/.devops` and are packaged with Kustomize.
Each folder provides the deployment, service, and supporting resources for the component.

## Bootstrap steps

1. Apply the Argo CD Applications from the consolidated `deploy/gitops/` folder (added to match the repo's deployment asset layout):
   ```bash
   kubectl apply -f deploy/gitops/server-application.yaml
   kubectl apply -f deploy/gitops/client-application.yaml
   kubectl apply -f deploy/gitops/apps-service-application.yaml
   ```
2. Update the container image references as needed (for example via Kustomize image overrides or Argo CD parameters).
3. Configure secrets such as `MONGODB_URI` with the values for your cluster before promoting beyond development.

All services default to the shared `fullstack-pilot` namespace. The provided Ingress routes `/api` to the backend API and `/` to the client UI on the host `fullstack-pilot.local`.
