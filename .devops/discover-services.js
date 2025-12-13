#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const [outputFile, configPathArg = 'repo-configs.yaml'] = process.argv.slice(2);

if (!outputFile) {
  console.error('Usage: discover-services.js <output-file> [config-path]');
  process.exit(1);
}

const configPath = path.resolve(configPathArg);

function writeOutput(value) {
  fs.appendFileSync(outputFile, `services=${value}\n`);
}

function readServicesPath() {
  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found at ${configPath}.`);
    return null;
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const match = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('services_path:'));

  if (!match) {
    console.error('services_path not defined in repo-configs.yaml.');
    return null;
  }

  const [, value] = match.split(/services_path:\s*/);
  const cleaned = value.replace(/^['"]|['"]$/g, '').trim();

  if (!cleaned) {
    console.error('services_path is empty in repo-configs.yaml.');
    return null;
  }

  return cleaned.replace(/^\//, '');
}

const servicesRoot = readServicesPath();

if (!servicesRoot) {
  writeOutput('[]');
  process.exit(0);
}

const servicesRootAbsolute = path.resolve(servicesRoot);

if (!fs.existsSync(servicesRootAbsolute) || !fs.statSync(servicesRootAbsolute).isDirectory()) {
  console.error(`services_path '${servicesRoot}' is not a directory.`);
  writeOutput('[]');
  process.exit(0);
}

const entries = fs.readdirSync(servicesRootAbsolute, { withFileTypes: true });

const serviceDirectories = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name.endsWith('-service'));

const servicesWithDockerfile = serviceDirectories
  .map((serviceName) => {
    const candidateRoots = [
      path.join(servicesRoot, serviceName),
      serviceName,
    ];

    const match = candidateRoots.find((candidate) =>
      fs.existsSync(path.resolve(candidate, 'Dockerfile')),
    );

    if (!match) {
      console.warn(`Skipping ${serviceName}: no Dockerfile found in ${candidateRoots.join(' or ')}.`);
      return null;
    }

    const dockerfilePath = path.join(match, 'Dockerfile');

    return {
      name: serviceName,
      path: match,
      dockerfile: dockerfilePath,
    };
  })
  .filter(Boolean);

if (servicesWithDockerfile.length === 0) {
  console.log('No backend services discovered.');
  writeOutput('[]');
  process.exit(0);
}

const matrix = JSON.stringify(servicesWithDockerfile);
console.log(`Services to build: ${matrix}`);
writeOutput(matrix);
