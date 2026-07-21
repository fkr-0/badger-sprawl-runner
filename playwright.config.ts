import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.BADGER_E2E_BASE_URL;
const e2eHost = process.env.BADGER_E2E_HOST ?? '127.0.0.1';
const e2ePort = Number(process.env.BADGER_E2E_PORT ?? 5173);
const baseURL = externalBaseUrl ?? `http://${e2eHost}:${e2ePort}`;

/**
 * Playwright E2E Test Configuration for Badger Sprawl Runner
 * Tests game mechanics, UI interactions, and platforming physics
 */
export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false, // Game tests may need to run sequentially
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // Run tests one at a time to avoid port conflicts
	reporter: 'html',
	use: {
		baseURL,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
	],

	// Start dev server before running tests
	webServer: externalBaseUrl
		? undefined
		: {
				command: `pnpm --filter @badger/runner exec vite --host ${e2eHost} --port ${e2ePort}`,
				url: baseURL,
				reuseExistingServer: !process.env.CI && process.env.BADGER_E2E_ISOLATED !== '1',
				timeout: 120 * 1000,
			},
});
