import { describe, expect, it } from 'vitest';

describe('main entry bootstrap', () => {
	it('can be imported in non-browser/test environments without throwing', async () => {
		await expect(import('./main')).resolves.toBeDefined();
	});
});
