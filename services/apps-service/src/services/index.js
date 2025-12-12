import appsRouter from './apps.js';

export const services = [
  { name: 'apps', basePath: '/api/apps', router: appsRouter },
];

export function findServiceByName(name) {
  return services.find((service) => service.name === name);
}
