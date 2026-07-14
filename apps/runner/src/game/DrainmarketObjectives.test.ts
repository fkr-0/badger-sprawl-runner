import { describe, expect, it } from 'vitest';
import type { ActionMap } from '../systems/InputSystem';
import {
	DRAINMARKET_CLINIC,
	DRAINMARKET_INVOICES,
	DrainmarketObjectives,
} from './DrainmarketObjectives';

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
	return { x: x - 16, y: y - 24, w: 32, h: 48 };
}

describe('DrainmarketObjectives', () => {
	it('completes the optional clinic invoice route', () => {
		const objectives = new DrainmarketObjectives();
		for (const invoice of DRAINMARKET_INVOICES) {
			objectives.observeAction(playerAt(invoice.x, invoice.y), action({ hackPressed: true }));
		}
		expect(objectives.getSnapshot().questComplete).toBe(true);
	});

	it('forgives the first wrong triage input with Street Syntax', () => {
		const objectives = new DrainmarketObjectives();
		const player = {
			...playerAt(DRAINMARKET_CLINIC.x, DRAINMARKET_CLINIC.y),
			itemSetEffects: { firstHackMistakeIgnored: true },
		};
		objectives.observeAction(player, action({ hackPressed: true }));

		expect(objectives.observeAction(player, action({ shootPressed: true }))).toContainEqual({
			kind: 'hack-mistake-ignored',
			id: 'injury-ledger-triage',
		});
		expect(objectives.getSnapshot().triageStatus).toBe('active');
		objectives.observeAction(player, action({ shootPressed: true }));
		expect(objectives.getSnapshot().triageStatus).toBe('failed');
	});

	it('runs the deterministic triage sequence and records a real knife parry lesson', () => {
		const objectives = new DrainmarketObjectives();
		objectives.observeAction(
			playerAt(DRAINMARKET_CLINIC.x, DRAINMARKET_CLINIC.y),
			action({ hackPressed: true })
		);
		objectives.observeAction(playerAt(0, 0), action({ parryPressed: true }));
		objectives.observeAction(playerAt(0, 0), action({ meleePressed: true }));
		objectives.observeAction(playerAt(0, 0), action({ shootPressed: true }));
		objectives.observeEnemyTelegraph('knife-lunge');
		objectives.observeParry('drainmarket:knife-lunge');

		const snapshot = objectives.getSnapshot();
		expect(snapshot.triageStatus).toBe('solved');
		expect(snapshot.parryTutorialComplete).toBe(true);
	});

	it('claims completion after triage, boss defeat, and stim-cache pickup', () => {
		const objectives = new DrainmarketObjectives();
		objectives.observeAction(
			playerAt(DRAINMARKET_CLINIC.x, DRAINMARKET_CLINIC.y),
			action({ hackPressed: true })
		);
		objectives.observeAction(playerAt(0, 0), action({ parryPressed: true }));
		objectives.observeAction(playerAt(0, 0), action({ meleePressed: true }));
		objectives.observeAction(playerAt(0, 0), action({ shootPressed: true }));
		objectives.observeWorld(true, true);

		expect(objectives.claimCompletion()).toMatchObject({
			stageId: 'drainmarket',
			completedMinigameIds: ['injury-ledger-triage'],
		});
		expect(objectives.claimCompletion()).toBeNull();
	});
});
