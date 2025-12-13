import { services, findServiceByName } from './services/index.js';

export function getActiveServices(serviceName) {
  if (!serviceName) {
    return services;
  }

  const normalizedName = serviceName.trim().toLowerCase();
  const service = findServiceByName(normalizedName);

  if (!service) {
    throw new Error(
      `Unknown service "${serviceName}". Available services: ${services
        .map((svc) => svc.name)
        .join(', ')}`
    );
  }

  return [service];
}
