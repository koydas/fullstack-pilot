import { spawnSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesRoot = __dirname;

const serviceDirectories = readdirSync(servicesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (serviceDirectories.length === 0) {
  console.warn('No service directories found under /services.');
  process.exit(0);
}

for (const serviceName of serviceDirectories) {
  const servicePath = join(servicesRoot, serviceName);
  const packagePath = join(servicePath, 'package.json');

  if (!existsSync(packagePath)) {
    console.warn(`Skipping ${serviceName}: no package.json found.`);
    continue;
  }

  console.log(`Installing dependencies for ${serviceName}...`);

  const result = spawnSync('npm', ['install'], {
    cwd: servicePath,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    console.error(`Failed to install dependencies for ${serviceName}.`);
    process.exit(result.status ?? 1);
  }
}

console.log('Finished installing dependencies for all services.');
