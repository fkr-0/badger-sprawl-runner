import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const host = '127.0.0.1';
const port = Number(process.env.BADGER_EVIDENCE_PORT ?? 5193);
const baseURL = `http://${host}:${port}`;
const evidenceDate = process.env.BADGER_EVIDENCE_DATE ?? '2026-07-26';
const evidenceRoot = resolve(`release-evidence/${evidenceDate}/browser`);

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	workers: 1,
	retries: 0,
	outputDir: resolve(evidenceRoot, 'artifacts'),
	reporter: [
		['line'],
		['json', { outputFile: resolve(evidenceRoot, 'report.json') }],
		['html', { outputFolder: resolve(evidenceRoot, 'html-report'), open: 'never' }],
	],
	use: {
		baseURL,
		trace: 'on',
		video: 'on',
		screenshot: 'on',
		viewport: { width: 1280, height: 720 },
	},
	projects: [
		{
			name: 'chromium-release-evidence',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
		},
	],
	webServer: {
		command: `pnpm --filter @badger/runner exec vite --host ${host} --port ${port}`,
		url: baseURL,
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			BADGER_RUNTIME_TOOLS: '1',
		},
	},
});
