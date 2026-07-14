import { describe, expect, it } from 'vitest';
import { resolveRuntimeAssetUrl, runtimeToolsEnabled } from './RuntimeEnvironment';

describe('RuntimeEnvironment', () => {
	it('resolves public assets relative to a nested artifact mount', () => {
		expect(
			resolveRuntimeAssetUrl(
				'/data/sprites.json',
				'https://example.test/artifacts/badger-sprawl-runner/dist/index.html'
			)
		).toBe('https://example.test/artifacts/badger-sprawl-runner/dist/data/sprites.json');
	});

	it('keeps production tools disabled unless explicitly requested', () => {
		expect(runtimeToolsEnabled({ dev: false, href: 'https://example.test/game/' })).toBe(false);
		expect(runtimeToolsEnabled({ dev: false, href: 'https://example.test/game/?debug=1' })).toBe(
			true
		);
	});
});
