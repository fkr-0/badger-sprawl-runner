import { describe, expect, it } from 'vitest';
import type { ActionMap } from '../systems/InputSystem';
import {
	MIRROR_ETIQUETTE_SEQUENCE,
	MIRROR_ETIQUETTE_TERMINAL,
	MIRROR_REFUSAL_GUESTS,
	MIRROR_TRAVERSAL_SEALS,
	MirrorPalaceObjectives,
} from './MirrorPalaceObjectives';

const idle: ActionMap = {
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
};

const playerAt = (x: number, y: number) => ({
	x: x - 17,
	y: y - 23,
	w: 34,
	h: 46,
	dir: 1,
	hasRocket: true,
	fuel: 3,
});

function completeTraversal(objectives: MirrorPalaceObjectives): void {
	const door = MIRROR_TRAVERSAL_SEALS[0];
	const loop = MIRROR_TRAVERSAL_SEALS[1];
	const switchback = MIRROR_TRAVERSAL_SEALS[2];
	if (!door || !loop || !switchback) throw new Error('missing traversal seal fixture');
	objectives.observeAction(playerAt(door.x, door.y), { ...idle, item: true, itemPressed: true });
	objectives.observeAction(playerAt(loop.x, loop.y), { ...idle, moveRight: true });
	objectives.observeAction(playerAt(loop.x, loop.y), { ...idle, moveLeft: true });
	objectives.observeAction(playerAt(switchback.x, switchback.y), {
		...idle,
		item: true,
		itemPressed: true,
	});
}

function hearGuests(objectives: MirrorPalaceObjectives): void {
	for (const guest of MIRROR_REFUSAL_GUESTS) {
		objectives.observeAction(playerAt(guest.x, guest.y), {
			...idle,
			hack: true,
			hackPressed: true,
			hackHeld: true,
		});
	}
}

describe('MirrorPalaceObjectives', () => {
	it('records three refusal testimonies and all authored rocket traversal lessons', () => {
		const objectives = new MirrorPalaceObjectives();
		hearGuests(objectives);
		completeTraversal(objectives);

		const snapshot = objectives.getSnapshot();
		expect(snapshot.guests.every((guest) => guest.heard)).toBe(true);
		expect(snapshot.traversalSeals.every((seal) => seal.broken)).toBe(true);
		expect(snapshot).toMatchObject({
			questComplete: true,
			traversalComplete: true,
			rocketTutorialComplete: true,
		});
	});

	it('solves the banquet refusal sequence and claims the full story result', () => {
		const objectives = new MirrorPalaceObjectives();
		hearGuests(objectives);
		completeTraversal(objectives);
		const terminalPlayer = playerAt(MIRROR_ETIQUETTE_TERMINAL.x, MIRROR_ETIQUETTE_TERMINAL.y);
		objectives.observeAction(terminalPlayer, { ...idle, hack: true, hackPressed: true, hackHeld: true });
		for (const input of MIRROR_ETIQUETTE_SEQUENCE) {
			objectives.observeAction(terminalPlayer, {
				...idle,
				parry: input === 'parry',
				parryPressed: input === 'parry',
				melee: input === 'melee',
				meleePressed: input === 'melee',
				dodge: input === 'dodge',
				dodgePressed: input === 'dodge',
			});
		}
		objectives.observeWorld(true, true);

		expect(objectives.claimCompletion()).toEqual({
			stageId: 'mirror-palace',
			completedQuestIds: ['table-of-refusals'],
			completedMinigameIds: ['banquet-etiquette-loop'],
			completedTutorialIds: ['rocket-switchback'],
		});
	});

	it('lets Street Syntax forgive the first etiquette mistake', () => {
		const objectives = new MirrorPalaceObjectives();
		hearGuests(objectives);
		completeTraversal(objectives);
		const player = {
			...playerAt(MIRROR_ETIQUETTE_TERMINAL.x, MIRROR_ETIQUETTE_TERMINAL.y),
			itemSetEffects: { firstHackMistakeIgnored: true },
		};
		objectives.observeAction(player, { ...idle, hack: true, hackPressed: true, hackHeld: true });

		expect(objectives.observeAction(player, { ...idle, melee: true, meleePressed: true })).toContainEqual({
			kind: 'hack-mistake-ignored',
			id: 'banquet-etiquette-loop',
		});
		expect(objectives.getSnapshot().etiquetteStatus).toBe('active');
		objectives.observeAction(player, { ...idle, melee: true, meleePressed: true });
		expect(objectives.getSnapshot()).toMatchObject({ etiquetteStatus: 'failed', mistakes: 1 });
	});
});
