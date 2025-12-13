import { spawn } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesRoot = join(__dirname, '..', 'services');

const npmExecPath = process.env.npm_execpath;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const spawnCommand = npmExecPath && npmExecPath.endsWith('.js') ? process.execPath : npmCommand;
const spawnArgs = npmExecPath && npmExecPath.endsWith('.js')
  ? [npmExecPath, 'run']
  : ['run'];

const serviceDirectories = readdirSync(servicesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (serviceDirectories.length === 0) {
  console.error('No services found under /services.');
  process.exit(1);
}

const runningServices = [];

for (const serviceName of serviceDirectories) {
  const servicePath = join(servicesRoot, serviceName);
  const packagePath = join(servicePath, 'package.json');

  if (!existsSync(packagePath)) {
    console.warn(`Skipping ${serviceName}: no package.json found.`);
    continue;
  }

  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const scriptName = packageJson.scripts?.dev ? 'dev' : packageJson.scripts?.start ? 'start' : null;

  if (!scriptName) {
    console.warn(`Skipping ${serviceName}: no dev/start script available.`);
    continue;
  }

  const child = spawn(spawnCommand, [...spawnArgs, scriptName], {
    cwd: servicePath,
    stdio: 'inherit',
    env: { ...process.env },
  });

  runningServices.push({ name: serviceName, child });

  child.on('exit', (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.log(`[${serviceName}] exited with ${reason}.`);
  });
}

if (runningServices.length === 0) {
  console.error('No runnable services found under /services.');
  process.exit(1);
}

console.log(`Started ${runningServices.length} service(s): ${runningServices.map((service) => service.name).join(', ')}`);
