import { describe, expect, it } from 'vitest';
import {
	FIRST_RELEASE_SKILL_NODES,
	FIRST_RELEASE_SKILL_TRACKS,
	createMetaState,
	createSkillTree,
	purchaseSkillWithMeta,
	resolveSkillEffects,
} from '../index';

describe('first-release badger skill tree', () => {
	it('defines four five-tier badger tracks', () => {
		expect(FIRST_RELEASE_SKILL_TRACKS).toEqual(['clawline', 'railgun', 'rocket', 'hacking']);

		for (const track of FIRST_RELEASE_SKILL_TRACKS) {
			const nodes = FIRST_RELEASE_SKILL_NODES.filter((node) => node.track === track);
			expect(nodes).toHaveLength(5);
			expect(nodes[0]?.prereqs).toEqual([]);
			expect(nodes.map((node) => node.tier)).toEqual([1, 2, 3, 4, 5]);
			expect(nodes.every((node) => Boolean(node.iconAnimation))).toBe(true);
			expect(nodes.every((node) => node.effects && Object.keys(node.effects).length > 0)).toBe(true);
		}
	});

	it('aggregates purchased skills into one runtime effect channel', () => {
		const resolved = resolveSkillEffects([
			'rail_mastery',
			'piercing_shot',
			'fuel_sipper',
			'public_exploit',
		]);

		expect(resolved.trackRanks).toMatchObject({ railgun: 2, rocket: 1, hacking: 1 });
		expect(resolved.effects).toMatchObject({
			railDamageBonus: 0.25,
			railPierceBonus: 1,
			rocketFuelBonus: 1,
			damageMitigation: 0.08,
		});
	});

	it('connects every prerequisite to an existing node', () => {
		const ids = new Set(FIRST_RELEASE_SKILL_NODES.map((node) => node.id));
		for (const node of FIRST_RELEASE_SKILL_NODES) {
			for (const prereq of node.prereqs) {
				expect(ids.has(prereq)).toBe(true);
			}
		}
	});

	it('allows buying the first rocket node and then its second node with meta shards', () => {
		const tree = createSkillTree();
		const meta = { ...createMetaState(), blueprintShards: 3 };

		const root = purchaseSkillWithMeta(tree, meta, 'fuel_sipper');
		expect(root.ok).toBe(true);
		if (!root.ok) throw new Error(root.reason);

		const second = purchaseSkillWithMeta(tree, root.state, 'vector_kick');
		expect(second.ok).toBe(true);
		if (!second.ok) throw new Error(second.reason);

		expect(second.state.blueprintShards).toBe(0);
		expect(second.state.purchasedSkills).toEqual(['fuel_sipper', 'vector_kick']);
		expect(tree.getNode('vector_kick')?.effects?.airControlBonus).toBe(0.12);
	});
});
