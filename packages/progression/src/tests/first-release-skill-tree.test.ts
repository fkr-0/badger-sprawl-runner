import { describe, expect, it } from 'vitest';
import { FIRST_RELEASE_SKILL_NODES, FIRST_RELEASE_SKILL_TRACKS, createMetaState, createSkillTree, purchaseSkillWithMeta } from '../index';

describe('first-release badger skill tree', () => {
	it('defines four extensible badger tracks with at least three nodes each', () => {
		expect(FIRST_RELEASE_SKILL_TRACKS).toEqual(['clawline', 'railgun', 'rocket', 'hacking']);

		for (const track of FIRST_RELEASE_SKILL_TRACKS) {
			const nodes = FIRST_RELEASE_SKILL_NODES.filter((node) => node.track === track);
			expect(nodes.length).toBeGreaterThanOrEqual(3);
			expect(nodes[0]?.prereqs).toEqual([]);
			expect(nodes.every((node) => node.effects && Object.keys(node.effects).length > 0)).toBe(true);
		}
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
