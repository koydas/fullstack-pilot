#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const [outputFile, baseShaArg, headShaArg, servicesDirArg = 'services', workflowPathArg = '.github/workflows/build-backend.yml'] = process.argv.slice(2);

if (!outputFile) {
  console.error('Usage: discover-services.js <output-file> [base-sha] [head-sha] [services-dir] [workflow-path]');
  process.exit(1);
}

const servicesDir = path.resolve(servicesDirArg);

function writeOutput(value) {
  fs.appendFileSync(outputFile, `services=${value}\n`);
}

if (!fs.existsSync(servicesDir)) {
  console.log('No services directory found.');
  writeOutput('[]');
  process.exit(0);
}

let baseSha = baseShaArg;
let headSha = headShaArg;

if (!headSha) {
  console.log('Missing HEAD sha; defaulting to build all services.');
  baseSha = '';
}

if (baseSha) {
  try {
    execSync(`git fetch --no-tags --prune --depth=1 origin ${baseSha}`, { stdio: 'ignore' });
  } catch (error) {
    // Ignore fetch failures and continue with best-effort comparison
  }
}

let workflowChanged = false;
if (baseSha && headSha) {
  try {
    const diff = execSync(`git diff --name-only ${baseSha} ${headSha} -- ${workflowPathArg}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    workflowChanged = diff.trim().length > 0;
  } catch (error) {
    workflowChanged = false;
  }
}

function discoverServices(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(dir, entry.name, 'Dockerfile')))
    .filter((entry) => fs.existsSync(path.join(dir, entry.name, 'package.json')))
    .map((entry) => entry.name);
}

const services = discoverServices(servicesDir);

let changedServices = [];

if (!baseSha || workflowChanged) {
  changedServices = services;
} else {
  changedServices = services.filter((service) => {
    try {
      const diff = execSync(`git diff --name-only ${baseSha} ${headSha} -- ${path.join(servicesDirArg, service)}`.trim(), {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return diff.trim().length > 0;
    } catch (error) {
      return false;
    }
  });
}

if (changedServices.length === 0) {
  console.log('No services changed; nothing to build.');
  writeOutput('[]');
  process.exit(0);
}

const matrix = JSON.stringify(changedServices);
console.log(`Services to build: ${matrix}`);
writeOutput(matrix);
