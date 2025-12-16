import childProcess from 'node:child_process';
import net from 'node:net';

export function createMssqlUtils({ timeoutMs, isDockerAvailable, isContainerPresent }) {
  async function runMssqlCheck(connectionString) {
    const target = new URL(connectionString);
    const host = target.hostname || 'localhost';
    const port = Number(target.port) || 1433;

    await new Promise((resolve, reject) => {
      const socket = net.connect({ host, port }, () => {
        socket.end();
        resolve();
      });

      const onError = (error) => {
        socket.destroy();
        reject(new Error(`Unable to reach MSSQL at ${host}:${port} (${error.message})`));
      };

      socket.setTimeout(timeoutMs, () => onError(new Error(`timeout after ${timeoutMs}ms`)));
      socket.on('error', onError);
    });
  }

  async function ensureMssqlHelper(connectionString) {
    if (process.env.SMOKE_MSSQL_SKIP_AUTOSTART === 'true') {
      return;
    }

    const target = connectionString || 'mssql://sa:YourStrong!Passw0rd@localhost:1433';

    try {
      await runMssqlCheck(target);
      return; // already reachable
    } catch (error) {
      console.warn(`MSSQL not reachable yet (${error.message}). Attempting to start helper container...`);
    }

    if (!isDockerAvailable()) {
      console.warn('Docker is not available; skipping MSSQL helper auto-start.');
      return;
    }

    const containerName = process.env.SMOKE_MSSQL_CONTAINER || 'fullstack-pilot-mssql';

    if (isContainerPresent(containerName)) {
      try {
        childProcess.execSync(`docker start ${containerName}`, { stdio: 'ignore' });
        return;
      } catch (error) {
        console.warn(`Failed to start existing MSSQL container ${containerName}: ${error.message}`);
      }
    }

    try {
      childProcess.execSync('npm run start:mssql', { stdio: 'inherit' });
    } catch (error) {
      console.warn(`Unable to auto-start MSSQL helper via npm script: ${error.message}`);
    }
  }

  return { runMssqlCheck, ensureMssqlHelper };
}
