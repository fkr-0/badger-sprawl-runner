import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import { SkillTreeScene } from './SkillTreeScene';

describe('SkillTreeScene', () => {
	it('exposes a four-track, five-tier graph through one canonical flow', () => {
		const scene = new SkillTreeScene({
			flow: createGameFlow({ blueprintShards: 20 }),
		});

		const snapshot = scene.getSnapshot();

		expect(snapshot.skills).toHaveLength(20);
		expect(snapshot.trackProgress).toEqual({ clawline: 0, railgun: 0, rocket: 0, hacking: 0 });
		expect(snapshot.skills.filter((skill) => skill.track === 'railgun').map((skill) => skill.tier)).toEqual([
			1, 2, 3, 4, 5,
		]);
	});

	it('keeps purchases and prerequisite progression in the selected track', () => {
		const flow = createGameFlow({ blueprintShards: 8 });
		const scene = new SkillTreeScene({ flow });

		scene.purchaseSelectedSkill();
		scene.moveSelection(1);
		scene.purchaseSelectedSkill();

		expect(scene.getSnapshot()).toMatchObject({
			purchasedSkills: ['double_swipe', 'parry_tooth'],
			trackProgress: { clawline: 2 },
		});
	});
});
