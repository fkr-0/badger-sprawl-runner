import { describe, expect, it } from 'vitest';
import {
	createMetaState,
	createSkillTree,
	hydrateSkillTree,
	purchaseSkillWithMeta,
} from '../index';

describe('skill tree meta purchases', () => {
	it('spends blueprint shards and records an unlocked root skill', () => {
		const tree = createSkillTree();
		const meta = { ...createMetaState(), blueprintShards: 1 };

		const result = purchaseSkillWithMeta(tree, meta, 'double_swipe');

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error(result.reason);
		expect(result.state.blueprintShards).toBe(0);
		expect(result.state.purchasedSkills).toEqual(['double_swipe']);
		expect(tree.getNode('double_swipe')?.unlocked).toBe(true);
	});

	it('rejects locked prerequisite skills without spending shards', () => {
		const tree = createSkillTree();
		const meta = { ...createMetaState(), blueprintShards: 5 };

		const result = purchaseSkillWithMeta(tree, meta, 'parry_tooth');

		expect(result.ok).toBe(false);
		expect(result.state.blueprintShards).toBe(5);
		if (result.ok) throw new Error('expected failure');
		expect(result.reason).toBe('missing-prerequisite');
	});

	it('hydrates existing purchases so later nodes become purchasable', () => {
		const tree = hydrateSkillTree(['double_swipe']);
		const meta = { ...createMetaState(), blueprintShards: 2, purchasedSkills: ['double_swipe'] };

		const result = purchaseSkillWithMeta(tree, meta, 'parry_tooth');

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error(result.reason);
		expect(result.state.blueprintShards).toBe(0);
		expect(result.state.purchasedSkills).toEqual(['double_swipe', 'parry_tooth']);
	});
});
