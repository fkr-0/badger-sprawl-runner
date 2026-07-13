import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { BossPhaseRuntimeState } from './BossPhaseSystem';
import { CaptainGrinController, type CaptainGrinEvent } from './CaptainGrinController';
import type { CombatEntity } from './CombatSystem';
import { CombatSystem } from './CombatSystem';

function boss(): CombatEntity {
	return {
		id: 'captain',
		bossId: 'tollbooth-captain-grin',
		x: 1480,
		y: 432,
		w: 52,
		h: 62,
		vx: 0,
		vy: 0,
		dir: -1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 8,
		maxHp: 8,
		invuln: 0,
		stun: 0,
	};
}

function phase(phaseIndex: number): BossPhaseRuntimeState {
	return {
		activePhaseId: phaseIndex === 0 ? 'receipt-wall' : 'compound-interest',
		activePhaseLabel: phaseIndex === 0 ? 'Receipt Wall' : 'Compound Interest',
		activeMechanic: 'test',
		phaseIndex,
		phaseCount: 2,
	};
}

describe('CaptainGrinController', () => {
	it('telegraphs and executes deterministic attacks', () => {
		const controller = new CaptainGrinController();
		const captain = boss();
		const player = createPlayer();
		player.x = 1600;
		const combat = new CombatSystem();
		const events: CaptainGrinEvent[] = [];

		for (let index = 0; index < 180; index += 1) {
			events.push(...controller.step(captain, player, phase(0), 1 / 60, combat));
		}

		expect(events).toContainEqual({ kind: 'boss-telegraph', attack: 'charge' });
		expect(events).toContainEqual({ kind: 'boss-attack', attack: 'charge' });
		expect(captain.usesPatternController).toBe(true);
		expect(captain.bossSpriteSheetId).toBe('boss_boss_captain_grin_tollmech');
	});

	it('switches to the signature attack after the phase transition', () => {
		const controller = new CaptainGrinController();
		const captain = boss();
		const player = createPlayer();
		const combat = new CombatSystem();
		controller.step(captain, player, phase(0), 1, combat);
		const transition = controller.step(captain, player, phase(1), 1 / 60, combat);
		expect(transition).toContainEqual({ kind: 'boss-phase-transition', phaseIndex: 1 });

		const events: CaptainGrinEvent[] = [];
		for (let index = 0; index < 360; index += 1) {
			events.push(...controller.step(captain, player, phase(1), 1 / 60, combat));
		}
		expect(events).toContainEqual({ kind: 'boss-attack', attack: 'receipt-burst' });
		expect(controller.getSnapshot().phaseIndex).toBe(1);
	});

	it('enters the defeat presentation once', () => {
		const controller = new CaptainGrinController();
		const captain = boss();
		captain.hp = 0;
		const first = controller.step(captain, createPlayer(), phase(1), 1 / 60, new CombatSystem());
		const second = controller.step(captain, createPlayer(), phase(1), 1 / 60, new CombatSystem());

		expect(first).toEqual([{ kind: 'boss-defeated' }]);
		expect(second).toEqual([]);
		expect(controller.getSnapshot().animation).toBe('defeat');
	});
});
