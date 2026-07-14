import { describe, expect, it } from 'vitest';
import type { ActionMap } from '../systems/InputSystem';
import {
	ARCOLOGY_CARGO_TAGS,
	ARCOLOGY_ROUTER,
	ARCOLOGY_SIGHTLINES,
	ChromeArcologyObjectives,
} from './ChromeArcologyObjectives';

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
	hasRailgun: true,
	shootCd: 0,
});

function completeAccessObjectives(objectives: ChromeArcologyObjectives): void {
	for (const sightline of ARCOLOGY_SIGHTLINES) {
		objectives.observeAction(playerAt(sightline.x, sightline.y), {
			...idle,
			shoot: true,
			shootPressed: true,
		});
	}
	for (const tag of ARCOLOGY_CARGO_TAGS) {
		objectives.observeAction(playerAt(tag.x, tag.y), {
			...idle,
			hack: true,
			hackPressed: true,
			hackHeld: true,
		});
	}
}

describe('ChromeArcologyObjectives', () => {
	it('teaches the railgun by piercing each authored sightline room', () => {
		const objectives = new ChromeArcologyObjectives();
		const first = ARCOLOGY_SIGHTLINES[0];
		if (!first) throw new Error('missing sightline');

		const events = objectives.observeAction(playerAt(first.x, first.y), {
			...idle,
			shoot: true,
			shootPressed: true,
		});

		expect(events).toContainEqual({
			kind: 'sightline-pierced',
			id: first.id,
			roomId: first.roomId,
		});
		expect(events).toContainEqual({ kind: 'tutorial-complete', id: 'railgun-sightline' });
		expect(objectives.getSnapshot().railgunTutorialComplete).toBe(true);
	});

	it('forgives one wrong elevator authority input with Street Syntax', () => {
		const objectives = new ChromeArcologyObjectives();
		completeAccessObjectives(objectives);
		const player = {
			...playerAt(ARCOLOGY_ROUTER.x, ARCOLOGY_ROUTER.y),
			itemSetEffects: { firstHackMistakeIgnored: true },
		};
		objectives.observeAction(player, { ...idle, hack: true, hackPressed: true, hackHeld: true });

		expect(
			objectives.observeAction(player, { ...idle, parry: true, parryPressed: true })
		).toContainEqual({ kind: 'hack-mistake-ignored', id: 'elevator-seed-router' });
		expect(objectives.getSnapshot().routerStatus).toBe('active');
		objectives.observeAction(player, { ...idle, parry: true, parryPressed: true });
		expect(objectives.getSnapshot().routerStatus).toBe('failed');
	});

	it('scans hidden labor tags and solves the elevator seed router', () => {
		const objectives = new ChromeArcologyObjectives();
		completeAccessObjectives(objectives);

		const startEvents = objectives.observeAction(playerAt(ARCOLOGY_ROUTER.x, ARCOLOGY_ROUTER.y), {
			...idle,
			hack: true,
			hackPressed: true,
			hackHeld: true,
		});
		expect(startEvents).toContainEqual({ kind: 'router-started', id: 'elevator-seed-router' });

		objectives.observeAction(playerAt(ARCOLOGY_ROUTER.x, ARCOLOGY_ROUTER.y), {
			...idle,
			shoot: true,
			shootPressed: true,
		});
		objectives.observeAction(playerAt(ARCOLOGY_ROUTER.x, ARCOLOGY_ROUTER.y), {
			...idle,
			parry: true,
			parryPressed: true,
		});
		const completeEvents = objectives.observeAction(
			playerAt(ARCOLOGY_ROUTER.x, ARCOLOGY_ROUTER.y),
			{ ...idle, shoot: true, shootPressed: true }
		);

		expect(completeEvents).toContainEqual({
			kind: 'router-complete',
			id: 'elevator-seed-router',
		});
		expect(objectives.getSnapshot()).toMatchObject({
			questComplete: true,
			routerStatus: 'solved',
		});
	});

	it('claims stage completion only after routing, boss defeat, and payload recovery', () => {
		const objectives = new ChromeArcologyObjectives();
		completeAccessObjectives(objectives);
		const routerPlayer = playerAt(ARCOLOGY_ROUTER.x, ARCOLOGY_ROUTER.y);
		objectives.observeAction(routerPlayer, {
			...idle,
			hack: true,
			hackPressed: true,
			hackHeld: true,
		});
		objectives.observeAction(routerPlayer, { ...idle, shoot: true, shootPressed: true });
		objectives.observeAction(routerPlayer, { ...idle, parry: true, parryPressed: true });
		objectives.observeAction(routerPlayer, { ...idle, shoot: true, shootPressed: true });

		expect(objectives.claimCompletion()).toBeNull();
		expect(objectives.observeWorld(true, true)).toEqual([
			{ kind: 'stage-ready', id: 'chrome-arcology' },
		]);
		expect(objectives.claimCompletion()).toEqual({
			stageId: 'chrome-arcology',
			completedQuestIds: ['cargo-name-tags'],
			completedMinigameIds: ['elevator-seed-router'],
			completedTutorialIds: ['railgun-sightline'],
		});
	});
});
