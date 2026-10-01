# GitOps layout

Service-specific Kubernetes manifests live under `services/<service>/.devops` and are packaged with Kustomize.
Each folder provides the deployment, service, and supporting resources for the component. Only `apps-service`, `services-service` and `dependencies-service` have manifests; the client and `agent-service` are not deployed via GitOps.

## Bootstrap steps

1. Apply the Argo CD Applications from the consolidated `.gitops/` folder:
   ```bash
   kubectl apply -f .gitops/apps-service-application.yaml
   kubectl apply -f .gitops/services-service-application.yaml
   kubectl apply -f .gitops/dependencies-service-application.yaml
   ```
2. Update the container image references as needed (for example via Kustomize image overrides or Argo CD parameters).
3. Configure secrets such as `MONGODB_URI` with the values for your cluster before promoting beyond development.

All services default to the shared `fullstack-pilot` namespace.
