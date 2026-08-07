import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import type { ActionMap } from './InputSystem';
import { ResolutionApproachTracker } from './ResolutionApproachTracker';

const quietAction = (): ActionMap => ({
	moveLeft: false,
	moveRight: false,
	jump: false,
	jumpPressed: false,
	fastFall: false,
	melee: false,
	meleePressed: false,
	shoot: false,
	shootPressed: false,
	item: false,
	itemPressed: false,
	parry: false,
	parryPressed: false,
	dodge: false,
	dodgePressed: false,
	hack: false,
	hackPressed: false,
	hackHeld: false,
	pause: false,
	pausePressed: false,
	debugToggle: false,
});

function enemy(x: number): CombatEntity {
	return {
		id: 'observer',
		x,
		y: 420,
		w: 34,
		h: 32,
		vx: 0,
		vy: 0,
		dir: -1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 2,
		maxHp: 2,
		stun: 0,
		invuln: 0,
		awarenessState: 'routine',
	};
}

describe('ResolutionApproachTracker', () => {
	it('records live action families without awarding anything itself', () => {
		const tracker = new ResolutionApproachTracker();
		tracker.observeAction({ ...quietAction(), meleePressed: true, melee: true });
		tracker.observeAction({ ...quietAction(), shootPressed: true, shoot: true });
		tracker.observeAction({ ...quietAction(), hackPressed: true, hack: true, hackHeld: true });

		expect(tracker.getSnapshot().approaches).toEqual(['ballistics', 'claw', 'hacking']);
	});

	it('recognizes bounded stealth exposure rather than mere inactivity', () => {
		const tracker = new ResolutionApproachTracker({
			ghoststepProximity: 400,
			ghoststepEvidenceSeconds: 0.5,
		});
		const player = createPlayer();
		player.x = 100;
		const observer = enemy(260);
		tracker.observeEncounter([observer], player, 0.6);

		expect(tracker.getSnapshot()).toMatchObject({
			approaches: ['ghoststep'],
			undetected: true,
		});
	});

	it('decorates a resolved situation with constraints and stays kill-agnostic until completion', () => {
		const tracker = new ResolutionApproachTracker();
		tracker.recordSemanticApproach('repair');
		tracker.observeCombatEvent({ kind: 'kill', source: 'player' });

		expect(
			tracker.decorate({
				stageId: 'chrome-arcology',
				completedQuestIds: [],
				completedMinigameIds: [],
				completedTutorialIds: [],
			})
		).toMatchObject({
			resolutionApproaches: ['repair'],
			resolutionConstraints: { nonLethal: false, undetected: true },
		});
	});
});
