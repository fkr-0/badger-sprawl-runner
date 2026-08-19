import { spawn } from 'node:child_process';

const port = Number(process.env.ARCADE_DESKTOP_PORT ?? 5173);
const url = `http://127.0.0.1:${port}/`;

function run(command, args, env = process.env) {
  return spawn(command, args, { stdio: 'inherit', env });
}

const vite = run('pnpm', [
  '--filter',
  '@badger/runner',
  'exec',
  'vite',
  '--host',
  '127.0.0.1',
  '--port',
  String(port),
  '--strictPort',
]);

async function waitForVite() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (vite.exitCode !== null) throw new Error('Vite exited before Electron started');
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`Timed out waiting for Vite at ${url}`);
}

let electron;
const stop = () => {
  if (electron?.exitCode === null) electron.kill('SIGTERM');
  if (vite.exitCode === null) vite.kill('SIGTERM');
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

try {
  await waitForVite();
  electron = run('pnpm', ['exec', 'electron', '.'], {
    ...process.env,
    ARCADE_DESKTOP_DEV_URL: url,
  });
  const code = await new Promise((resolve) => electron.once('exit', resolve));
  process.exitCode = typeof code === 'number' ? code : 1;
} finally {
  stop();
}
