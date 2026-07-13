import { describe, expect, it } from 'vitest';
import type { ActionMap } from '../systems/InputSystem';
import {
	LOWER_SPRAWL_METERS,
	LOWER_SPRAWL_TOLL_GATE,
	LowerSprawlObjectives,
} from './LowerSprawlObjectives';

function action(overrides: Partial<ActionMap> = {}): ActionMap {
	return {
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
		...overrides,
	};
}

function playerAt(x: number, y: number) {
	return { x: x - 17, y: y - 23, w: 34, h: 46 };
}

describe('LowerSprawlObjectives', () => {
	it('completes the meter side quest and route-reading tutorial through nearby hack interactions', () => {
		const objectives = new LowerSprawlObjectives();
		for (const meter of LOWER_SPRAWL_METERS) {
			objectives.observeAction(playerAt(meter.x, meter.y), action({ hackPressed: true }));
		}

		expect(objectives.getSnapshot()).toMatchObject({
			questComplete: true,
			tutorials: { publicRouteReading: true },
		});
	});

	it('solves the toll rhythm sequence and exposes expected input progression', () => {
		const objectives = new LowerSprawlObjectives();
		const player = playerAt(LOWER_SPRAWL_TOLL_GATE.x, LOWER_SPRAWL_TOLL_GATE.y);
		objectives.observeAction(player, action({ hackPressed: true }));
		expect(objectives.getSnapshot().expectedInput).toBe('melee');
		objectives.observeAction(player, action({ meleePressed: true }));
		expect(objectives.getSnapshot().expectedInput).toBe('parry');
		objectives.observeAction(player, action({ parryPressed: true }));
		expect(objectives.getSnapshot().expectedInput).toBe('shoot');
		objectives.observeAction(player, action({ shootPressed: true }));
		expect(objectives.getSnapshot().puzzleStatus).toBe('solved');
	});

	it('only claims stage completion once after puzzle, payload, and boss are complete', () => {
		const objectives = new LowerSprawlObjectives();
		const player = playerAt(LOWER_SPRAWL_TOLL_GATE.x, LOWER_SPRAWL_TOLL_GATE.y);
		objectives.observeAction(player, action({ jumpPressed: true }));
		objectives.observeAction(player, action({ hackPressed: true }));
		objectives.observeAction(player, action({ meleePressed: true }));
		objectives.observeAction(player, action({ parryPressed: true }));
		objectives.observeAction(player, action({ shootPressed: true }));
		objectives.observeWorld(true, true);

		expect(objectives.claimCompletion()).toEqual({
			stageId: 'lower-sprawl',
			completedQuestIds: [],
			completedMinigameIds: ['toll-gate-rhythm'],
			completedTutorialIds: ['jump-coyote'],
		});
		expect(objectives.claimCompletion()).toBeNull();
	});
});
