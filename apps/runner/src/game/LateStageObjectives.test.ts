import { describe, expect, it } from 'vitest';
import type { ActionMap } from '../systems/InputSystem';
import {
	LATE_STAGE_OBJECTIVE_CONFIG,
	LateStageObjectives,
	type LateStageInterfaceSnapshot,
} from './LateStageObjectives';
import type { LateStoryStageId } from './LateStageSpriteBindings';

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

function playerAt(x: number, y: number): { x: number; y: number; w: number; h: number } {
	return { x: x - 17, y: y - 23, w: 34, h: 46 };
}

function key(code: string, value = ''): Pick<KeyboardEvent, 'code' | 'key'> {
	return { code, key: value };
}

const SELECTION_SOLUTIONS: Readonly<Record<string, readonly number[]>> = {
	'cargo-lock-intake': [1, 2, 1],
	'cargo-lock-counterweight': [2, 1, 0],
	'cargo-lock-orbit': [1, 0, 2],
	'transmitter-root-listen': [0, 2, 1],
	'transmitter-root-teach': [1, 0, 2],
	'transmitter-root-release': [2, 1, 0],
};

function solveInterface(objectives: LateStageObjectives): void {
	const active = objectives.getSnapshot().interface;
	expect(active.status).toBe('active');
	if (active.status !== 'active') return;
	if (active.kind === 'fasttype') {
		for (const character of active.target) {
			objectives.handleInterfaceKey(key('', character));
		}
		objectives.handleInterfaceKey(key('Enter'));
		return;
	}
	const solution = SELECTION_SOLUTIONS[active.nodeId];
	if (!solution) throw new Error(`Missing authored test solution for ${active.nodeId}`);
	for (let columnIndex = 0; columnIndex < active.columns.length; columnIndex += 1) {
		const solutionIndex = solution[columnIndex] ?? 0;
		objectives.handleInterfaceKey(key(`Digit${solutionIndex + 1}`));
		if (columnIndex < active.columns.length - 1) {
			objectives.handleInterfaceKey(key('ArrowRight'));
		}
	}
	objectives.handleInterfaceKey(key('Enter'));
}

function completePrimaryNodes(objectives: LateStageObjectives, stageId: LateStoryStageId): void {
	for (const node of LATE_STAGE_OBJECTIVE_CONFIG[stageId].primaryNodes) {
		const started = objectives.observeAction(playerAt(node.x, node.y), action({ hackPressed: true }));
		expect(started).toContainEqual({
			kind: 'interface-started',
			id: node.id,
			interfaceKind:
				stageId === 'antenna-barrens'
					? 'fasttype'
					: stageId === 'orbital-lift'
						? 'cargo-routing'
						: 'broadcast-composition',
		});
		solveInterface(objectives);
		expect(
			objectives.getSnapshot().primaryNodes.find((candidate) => candidate.id === node.id)?.completed
		).toBe(true);
	}
}

function completeSupportNodes(objectives: LateStageObjectives, stageId: LateStoryStageId): void {
	for (const node of LATE_STAGE_OBJECTIVE_CONFIG[stageId].supportNodes) {
		objectives.observeAction(playerAt(node.x, node.y), action({ hackPressed: true }));
	}
}

describe('LateStageObjectives dedicated interfaces', () => {
	it('runs exact FastType repair input before completing an Antenna Barrens gate', () => {
		const objectives = new LateStageObjectives('antenna-barrens');
		const node = LATE_STAGE_OBJECTIVE_CONFIG['antenna-barrens'].primaryNodes[0];
		if (!node) throw new Error('Missing antenna test node');
		objectives.observeAction(playerAt(node.x, node.y), action({ hackPressed: true }));
		let snapshot = objectives.getSnapshot().interface;
		expect(snapshot).toMatchObject({ status: 'active', kind: 'fasttype', attemptsLeft: 3 });
		if (snapshot.status !== 'active' || snapshot.kind !== 'fasttype') return;
		for (const character of 'wrong') objectives.handleInterfaceKey(key('', character));
		const failed = objectives.handleInterfaceKey(key('Enter'));
		expect(failed.events).toEqual([
			expect.objectContaining({ kind: 'interface-failed', reason: 'mismatch', attemptsLeft: 2 }),
		]);
		snapshot = objectives.getSnapshot().interface;
		expect(snapshot).toMatchObject({
			status: 'active',
			kind: 'fasttype',
			input: '',
			mistakes: 1,
			feedbackKind: 'error',
		});
		solveInterface(objectives);
		expect(objectives.getSnapshot()).toMatchObject({ tutorialComplete: true });
		expect(objectives.getSnapshot().primaryNodes[0]).toMatchObject({
			completed: true,
			grade: 'recovered',
		});
	});

	it('runs a three-column cargo routing board with cursor and option controls', () => {
		const objectives = new LateStageObjectives('orbital-lift');
		const node = LATE_STAGE_OBJECTIVE_CONFIG['orbital-lift'].primaryNodes[0];
		if (!node) throw new Error('Missing cargo test node');
		objectives.observeAction(playerAt(node.x, node.y), action({ hackPressed: true }));
		let snapshot = objectives.getSnapshot().interface;
		expect(snapshot).toMatchObject({
			status: 'active',
			kind: 'cargo-routing',
			focusIndex: 0,
			columns: expect.arrayContaining([expect.objectContaining({ label: 'SUBJECT' })]),
		});
		objectives.handleInterfaceKey(key('Digit2'));
		objectives.handleInterfaceKey(key('ArrowRight'));
		objectives.handleInterfaceKey(key('Digit3'));
		objectives.handleInterfaceKey(key('ArrowRight'));
		objectives.handleInterfaceKey(key('Digit2'));
		snapshot = objectives.getSnapshot().interface;
		expect(snapshot).toMatchObject({ preview: 'PERSON  →  WITNESS  →  PUBLIC LIFT' });
		objectives.handleInterfaceKey(key('Enter'));
		expect(objectives.getSnapshot().primaryNodes[0]?.completed).toBe(true);
	});

	it('preserves valid route work, marks only conflicting columns, and does not expose solutions', () => {
		const objectives = new LateStageObjectives('orbital-lift');
		const node = LATE_STAGE_OBJECTIVE_CONFIG['orbital-lift'].primaryNodes[0];
		if (!node) throw new Error('Missing cargo feedback test node');
		objectives.observeAction(playerAt(node.x, node.y), action({ hackPressed: true }));
		objectives.handleInterfaceKey(key('Digit2'));
		const failed = objectives.handleInterfaceKey(key('Enter'));
		expect(failed.events).toEqual([
			expect.objectContaining({ kind: 'interface-failed', attemptsLeft: 2 }),
		]);
		let snapshot = objectives.getSnapshot().interface;
		expect(snapshot).not.toHaveProperty('solutionIndexes');
		expect(snapshot).toMatchObject({
			status: 'active',
			kind: 'cargo-routing',
			incorrectColumnIds: ['standing', 'destination'],
			columns: [
				expect.objectContaining({ id: 'subject', selectedIndex: 1, hint: null }),
				expect.objectContaining({ id: 'standing', hint: expect.stringContaining('WITNESS') }),
				expect.objectContaining({ id: 'destination', hint: expect.stringContaining('PUBLIC LIFT') }),
			],
		});
		objectives.handleInterfaceKey(key('ArrowRight'));
		objectives.handleInterfaceKey(key('Digit3'));
		objectives.handleInterfaceKey(key('ArrowRight'));
		objectives.handleInterfaceKey(key('Digit2'));
		objectives.handleInterfaceKey(key('Enter'));
		snapshot = objectives.getSnapshot().interface;
		expect(snapshot).toEqual({ status: 'idle', kind: null });
		expect(objectives.getSnapshot().primaryNodes[0]).toMatchObject({
			completed: true,
			grade: 'recovered',
		});
	});

	it('activates a timer-free public assist instead of blocking after repeated failures', () => {
		const objectives = new LateStageObjectives('antenna-barrens');
		const node = LATE_STAGE_OBJECTIVE_CONFIG['antenna-barrens'].primaryNodes[0];
		if (!node) throw new Error('Missing assisted FastType test node');
		objectives.observeAction(playerAt(node.x, node.y), action({ hackPressed: true }));
		for (let attempt = 0; attempt < 3; attempt += 1) {
			objectives.handleInterfaceKey(key('', 'x'));
			objectives.handleInterfaceKey(key('Enter'));
		}
		let snapshot = objectives.getSnapshot().interface;
		expect(snapshot).toMatchObject({
			status: 'active',
			kind: 'fasttype',
			assistActive: true,
			attemptsLeft: 0,
			feedbackKind: 'assist',
			expectedChar: 'v',
		});
		if (snapshot.status !== 'active') return;
		const pausedTime = snapshot.timeRemaining;
		expect(objectives.step(100)).toEqual([]);
		expect(objectives.getSnapshot().interface).toMatchObject({ timeRemaining: pausedTime });
		if (snapshot.kind !== 'fasttype') return;
		for (const character of snapshot.target) objectives.handleInterfaceKey(key('', character));
		const completed = objectives.handleInterfaceKey(key('Enter'));
		expect(completed.events).toContainEqual(
			expect.objectContaining({ kind: 'interface-completed', grade: 'assisted', mistakes: 3 })
		);
		expect(objectives.getSnapshot().primaryNodes[0]).toMatchObject({
			completed: true,
			grade: 'assisted',
		});
	});

	it('runs a clause-based public broadcast composer instead of a one-key terminal', () => {
		const objectives = new LateStageObjectives('asteroid-redoubt');
		const node = LATE_STAGE_OBJECTIVE_CONFIG['asteroid-redoubt'].primaryNodes[0];
		if (!node) throw new Error('Missing broadcast test node');
		objectives.observeAction(playerAt(node.x, node.y), action({ hackPressed: true }));
		const started = objectives.getSnapshot().interface;
		expect(started).toMatchObject({
			status: 'active',
			kind: 'broadcast-composition',
			preview: 'THE CITY COMMANDS BEFORE IT SELLS',
		});
		solveInterface(objectives);
		expect(objectives.getSnapshot().primaryNodes[0]?.completed).toBe(true);
	});

	it('times out, resets the authored challenge, and allows Escape to cancel without completion', () => {
		const objectives = new LateStageObjectives('antenna-barrens');
		const node = LATE_STAGE_OBJECTIVE_CONFIG['antenna-barrens'].primaryNodes[0];
		if (!node) throw new Error('Missing timeout test node');
		objectives.observeAction(playerAt(node.x, node.y), action({ hackPressed: true }));
		expect(objectives.step(20)).toEqual([
			expect.objectContaining({ kind: 'interface-failed', reason: 'timeout', attemptsLeft: 2 }),
		]);
		expect(objectives.getSnapshot().interface).toMatchObject({ status: 'active', attemptsLeft: 2 });
		expect(objectives.handleInterfaceKey(key('Escape')).events).toEqual([
			expect.objectContaining({ kind: 'interface-cancelled', id: node.id }),
		]);
		expect(objectives.getSnapshot().interface).toEqual({ status: 'idle', kind: null });
		expect(objectives.getSnapshot().primaryNodes[0]?.completed).toBe(false);
	});

	for (const stageId of [
		'antenna-barrens',
		'orbital-lift',
		'asteroid-redoubt',
	] as const satisfies readonly LateStoryStageId[]) {
		it(`retains the authored ${stageId} completion contract after richer interface validation`, () => {
			const objectives = new LateStageObjectives(stageId);
			const config = LATE_STAGE_OBJECTIVE_CONFIG[stageId];
			completePrimaryNodes(objectives, stageId);
			completeSupportNodes(objectives, stageId);

			expect(objectives.getSnapshot()).toMatchObject({
				stageId,
				primaryComplete: true,
				supportComplete: true,
				tutorialComplete: true,
				readyToComplete: false,
			});
			expect(objectives.observeWorld(true, true)).toEqual([
				{ kind: 'stage-ready', id: stageId },
			]);
			expect(objectives.claimCompletion()).toEqual({
				stageId,
				completedQuestIds: [config.questId],
				completedMinigameIds: [config.minigameId],
				completedTutorialIds: [config.tutorialId],
			});
			expect(objectives.claimCompletion()).toBeNull();
		});
	}

	it('still allows optional support work to remain incomplete without blocking stage completion', () => {
		const objectives = new LateStageObjectives('orbital-lift');
		completePrimaryNodes(objectives, 'orbital-lift');
		objectives.observeWorld(true, true);
		expect(objectives.claimCompletion()).toMatchObject({ completedQuestIds: [] });
	});
});
