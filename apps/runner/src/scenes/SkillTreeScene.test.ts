import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import { SkillTreeScene } from './SkillTreeScene';

describe('SkillTreeScene', () => {
	it('exposes four branched twelve-node, five-tier disciplines', () => {
		const scene = new SkillTreeScene({
			flow: createGameFlow({ blueprintShards: 20 }),
		});
		const snapshot = scene.getSnapshot();

		expect(snapshot.skills).toHaveLength(48);
		expect(snapshot.trackProgress).toEqual({ clawline: 0, railgun: 0, rocket: 0, hacking: 0 });
		expect(snapshot.trackTotals).toEqual({ clawline: 24, railgun: 24, rocket: 24, hacking: 24 });
		for (const track of ['clawline', 'railgun', 'rocket', 'hacking']) {
			const nodes = snapshot.skills.filter((skill) => skill.track === track);
			expect(nodes).toHaveLength(12);
			expect(new Set(nodes.map((skill) => skill.tier))).toEqual(new Set([1, 2, 3, 4, 5]));
			expect(new Set(nodes.map((skill) => skill.column))).toEqual(new Set([0, 1, 2]));
		}
	});

	it('keeps purchases and prerequisite progression in the selected track', () => {
		const flow = createGameFlow({ blueprintShards: 8 });
		const scene = new SkillTreeScene({ flow });

		scene.purchaseSelectedSkill();
		scene.moveSelection(1);
		scene.purchaseSelectedSkill();

		expect(scene.getSnapshot()).toMatchObject({
			purchasedSkills: ['double_swipe', 'parry_tooth'],
			skillRanks: { double_swipe: 1, parry_tooth: 1 },
			trackProgress: { clawline: 2 },
		});
	});

	it('invests multiple ranks without duplicating the save-facing skill id', () => {
		const flow = createGameFlow({ blueprintShards: 4 });
		const scene = new SkillTreeScene({ flow });
		scene.moveSelection(5);
		scene.purchaseSelectedSkill();
		scene.purchaseSelectedSkill();
		scene.purchaseSelectedSkill();

		expect(scene.getSnapshot()).toMatchObject({
			selectedSkillId: 'iron_knuckles',
			purchasedSkills: ['iron_knuckles'],
			skillRanks: { iron_knuckles: 3 },
			blueprintShards: 1,
			trackProgress: { clawline: 3 },
		});
	});
});
