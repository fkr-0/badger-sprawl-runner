import { describe, expect, it } from 'vitest';
import {
	FIRST_RELEASE_SKILL_NODES,
	FIRST_RELEASE_SKILL_TRACKS,
	SKILL_TRACK_PRESENTATION,
	createMetaState,
	createSkillTree,
	purchaseSkillWithMeta,
	resolveSkillEffects,
} from '../index';

describe('first-release badger skill tree', () => {
	it('defines four twelve-node, five-tier branched disciplines', () => {
		expect(FIRST_RELEASE_SKILL_TRACKS).toEqual(['clawline', 'railgun', 'rocket', 'hacking']);
		expect(SKILL_TRACK_PRESENTATION.railgun.shortLabel).toBe('BALLISTICS');
		expect(SKILL_TRACK_PRESENTATION.rocket.label).toContain('Stealth');

		for (const track of FIRST_RELEASE_SKILL_TRACKS) {
			const nodes = FIRST_RELEASE_SKILL_NODES.filter((node) => node.track === track);
			expect(nodes).toHaveLength(12);
			expect(new Set(nodes.map((node) => node.tier))).toEqual(new Set([1, 2, 3, 4, 5]));
			expect(new Set(nodes.map((node) => node.column))).toEqual(new Set([0, 1, 2]));
			expect(nodes.every((node) => Boolean(node.iconAnimation))).toBe(true);
			expect(nodes.every((node) => node.effects && Object.keys(node.effects).length > 0)).toBe(true);
		}
	});

	it('aggregates purchased skills and scales multi-rank passives', () => {
		const resolved = resolveSkillEffects(
			['rail_mastery', 'piercing_shot', 'fuel_sipper', 'public_exploit', 'breach_math'],
			{ breach_math: 3 }
		);

		expect(resolved.trackRanks).toMatchObject({ railgun: 5, rocket: 1, hacking: 1 });
		expect(resolved.effects).toMatchObject({
			railDamageBonus: 0.49,
			railPierceBonus: 1,
			rocketFuelBonus: 1,
			damageMitigation: 0.08,
			armorPierceBonus: 0.18,
		});
	});

	it('connects prerequisites to existing nodes in the same discipline', () => {
		const byId = new Map(FIRST_RELEASE_SKILL_NODES.map((node) => [node.id, node]));
		for (const node of FIRST_RELEASE_SKILL_NODES) {
			for (const prereq of node.prereqs) {
				expect(byId.get(prereq)?.track).toBe(node.track);
			}
		}
	});

	it('allows buying the first ghoststep node and then its second node', () => {
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
		expect(second.state.skillRanks).toMatchObject({ fuel_sipper: 1, vector_kick: 1 });
		expect(tree.getNode('vector_kick')?.effects?.airControlBonus).toBe(0.12);
	});
});
