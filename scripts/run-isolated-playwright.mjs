import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

async function findAvailablePort(host) {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.unref();
		server.once('error', reject);
		server.listen(0, host, () => {
			const address = server.address();
			if (!address || typeof address === 'string') {
				server.close(() => reject(new Error('Unable to allocate an isolated E2E port.')));
				return;
			}
			const { port } = address;
			server.close((error) => (error ? reject(error) : resolve(port)));
		});
	});
}

const host = process.env.BADGER_E2E_HOST ?? '127.0.0.1';
const configuredPort = Number(process.env.BADGER_E2E_PORT);
const port =
	Number.isInteger(configuredPort) && configuredPort > 0
		? configuredPort
		: await findAvailablePort(host);
const args = ['exec', 'playwright', 'test', ...process.argv.slice(2)];
const env = {
	...process.env,
	BADGER_E2E_HOST: host,
	BADGER_E2E_PORT: String(port),
	BADGER_E2E_ISOLATED: '1',
};

console.info(`Running isolated Playwright on http://${host}:${port}`);

const child = spawn('pnpm', args, {
	cwd: process.cwd(),
	env,
	stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => child.kill(signal));
}

child.once('error', (error) => {
	console.error(error);
	process.exitCode = 1;
});
child.once('exit', (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exitCode = code ?? 1;
});
