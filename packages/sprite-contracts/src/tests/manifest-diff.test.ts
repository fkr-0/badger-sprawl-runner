import { describe, expect, it } from 'vitest';
import {
	createSpriteManifestContractKey,
	createSpriteManifestReloadPlan,
	createSpriteSheetContractKey,
	diffSpriteManifests,
} from '../manifest-diff';
import type { SpriteManifest, SpriteSheet } from '../types';

function sheet(id: string, overrides: Partial<SpriteSheet> = {}): SpriteSheet {
	return {
		id,
		file: `${id}.png`,
		frameSize: [16, 16],
		animations: { idle: { frames: 2, fps: 8 } },
		...overrides,
	};
}

function manifest(...sheets: SpriteSheet[]): SpriteManifest {
	return { version: '1.0.0', sheets };
}

describe('sprite manifest contract diff', () => {
	it('creates stable keys independent of object key order', () => {
		const first = sheet('actor', {
			source: { revision: 'v1', tool: 'test' },
			animations: { idle: { fps: 8, frames: 2 } },
		});
		const second = sheet('actor', {
			animations: { idle: { frames: 2, fps: 8 } },
			source: { tool: 'test', revision: 'v1' },
		});

		expect(createSpriteSheetContractKey(first)).toBe(createSpriteSheetContractKey(second));
		expect(createSpriteManifestContractKey(manifest(first))).toBe(
			createSpriteManifestContractKey(manifest(second))
		);
	});

	it('changes keys for file, animation, geometry, or source revision changes', () => {
		const original = sheet('actor', { source: { revision: 'v1' } });
		const key = createSpriteSheetContractKey(original);

		expect(createSpriteSheetContractKey(sheet('actor', { file: 'other.png' }))).not.toBe(key);
		expect(
			createSpriteSheetContractKey(sheet('actor', { animations: { idle: { frames: 3, fps: 8 } } }))
		).not.toBe(key);
		expect(createSpriteSheetContractKey(sheet('actor', { frameSize: [32, 16] }))).not.toBe(key);
		expect(createSpriteSheetContractKey(sheet('actor', { source: { revision: 'v2' } }))).not.toBe(key);
	});

	it('reports ordered additions, removals, changes, and unchanged sheets', () => {
		const stable = sheet('stable');
		const changed = sheet('changed', { source: { revision: 'v1' } });
		const removed = sheet('removed');
		const added = sheet('added');
		const result = diffSpriteManifests(
			manifest(stable, changed, removed),
			manifest(added, stable, sheet('changed', { source: { revision: 'v2' } }))
		);

		expect(result).toMatchObject({
			addedSheetIds: ['added'],
			removedSheetIds: ['removed'],
			changedSheetIds: ['changed'],
			unchangedSheetIds: ['stable'],
		});
		expect(result.changes).toEqual([
			expect.objectContaining({
				id: 'changed',
				previous: expect.objectContaining({ source: { revision: 'v1' } }),
				next: expect.objectContaining({ source: { revision: 'v2' } }),
			}),
		]);
	});

	it('plans reusable, forced, missing, changed, added, and evicted sheets deterministically', () => {
		const previous = manifest(
			sheet('reusable'),
			sheet('forced'),
			sheet('missing'),
			sheet('changed', { source: { revision: 'v1' } }),
			sheet('removed')
		);
		const next = manifest(
			sheet('added'),
			sheet('reusable'),
			sheet('forced'),
			sheet('missing'),
			sheet('changed', { source: { revision: 'v2' } })
		);
		const plan = createSpriteManifestReloadPlan(previous, next, {
			availableSheetIds: ['reusable', 'forced', 'changed'],
			forceReloadSheetIds: ['forced', 'unknown'],
		});

		expect(plan).toMatchObject({
			reuseUnchanged: true,
			availableSheetIds: ['reusable', 'forced', 'changed'],
			forcedReloadSheetIds: ['forced'],
			reusableSheetIds: ['reusable'],
			reloadSheetIds: ['added', 'forced', 'missing', 'changed'],
			evictedSheetIds: ['removed'],
			diff: {
				addedSheetIds: ['added'],
				removedSheetIds: ['removed'],
				changedSheetIds: ['changed'],
				unchangedSheetIds: ['reusable', 'forced', 'missing'],
			},
		});
		expect(plan.nextContractKeys.map((entry) => entry.sheetId)).toEqual([
			'added',
			'reusable',
			'forced',
			'missing',
			'changed',
		]);
	});

	it('can disable all unchanged-sheet reuse', () => {
		const previous = manifest(sheet('one'), sheet('two'));
		const next = manifest(sheet('one'), sheet('two'));
		const plan = createSpriteManifestReloadPlan(previous, next, {
			availableSheetIds: ['one', 'two'],
			reuseUnchanged: false,
		});

		expect(plan).toMatchObject({
			reuseUnchanged: false,
			reusableSheetIds: [],
			reloadSheetIds: ['one', 'two'],
		});
	});

	it('treats every sheet as added when no previous manifest exists', () => {
		const result = diffSpriteManifests(null, manifest(sheet('one'), sheet('two')));

		expect(result).toMatchObject({
			addedSheetIds: ['one', 'two'],
			removedSheetIds: [],
			changedSheetIds: [],
			unchangedSheetIds: [],
		});
	});
});
