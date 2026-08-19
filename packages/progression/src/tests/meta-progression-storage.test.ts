import { describe, expect, it } from 'vitest';
import { createMemoryStorageAdapter } from '@arcade/runtime/storage';
import { MetaProgression, createMetaState } from '../MetaProgression';

const STORAGE_KEY = 'bsr-meta-v1';

describe('MetaProgression runtime storage', () => {
	it('stores meta state in the runtime versioned envelope', () => {
		const storage = createMemoryStorageAdapter();
		const progression = new MetaProgression(storage);
		progression.save({ ...createMetaState(), blueprintShards: 4, purchasedSkills: ['double_swipe'] });

		const raw = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>;
		expect(raw).toMatchObject({ format: 1, version: 1 });
		expect(progression.load()).toMatchObject({
			blueprintShards: 4,
			purchasedSkills: ['double_swipe'],
			skillRanks: { double_swipe: 1 },
		});
	});

	it('promotes the legacy raw v1 record without losing progress', () => {
		const storage = createMemoryStorageAdapter({
			[STORAGE_KEY]: JSON.stringify({
				...createMetaState(),
				version: 1,
				credchips: 9,
				purchasedSkills: ['parry_tooth'],
			}),
		});
		const progression = new MetaProgression(storage);

		expect(progression.load()).toMatchObject({
			credchips: 9,
			purchasedSkills: ['parry_tooth'],
			skillRanks: { parry_tooth: 1 },
		});
		expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
			format: 1,
			version: 1,
		});
	});
});
