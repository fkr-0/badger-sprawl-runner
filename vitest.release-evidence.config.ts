import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['apps/runner/src/release/ReleaseEvidenceCollector.test.ts'],
		exclude: ['.claude/**'],
	},
});
