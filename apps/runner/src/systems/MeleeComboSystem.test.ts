import { describe, expect, it } from 'vitest';
import { MeleeComboSystem, createMeleeComboState, decayMeleeCombo, resolveNextMeleeMove } from './MeleeComboSystem';
import type { CombatEntity } from './CombatSystem';
import type { Entity } from './PhysicsSystem';

function player(overrides: Partial<Entity> = {}): Entity {
	return {
		x: 0,
		y: 0,
		w: 30,
		h: 40,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		...overrides,
	};
}

function enemy(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		...player({ x: 45, y: 5 }),
		hp: 5,
		maxHp: 5,
		invuln: 0,
		stun: 0,
		...overrides,
	};
}

describe('MeleeComboSystem', () => {
	it('resolves a starter and chained light combo inside the combo window', () => {
		const state = createMeleeComboState(['double_swipe']);
		const jab = resolveNextMeleeMove(state, 'light', player());
		expect(jab?.id).toBe('claw_jab');

		const chained = resolveNextMeleeMove(
			{ ...state, activeMoveId: 'claw_jab', comboTimer: 0.2, chainDepth: 1 },
			'light',
			player()
		);
		expect(chained?.id).toBe('claw_cross');
	});

	it('gates the cross-claw follow-up behind Double Swipe', () => {
		const base = { ...createMeleeComboState(), activeMoveId: 'claw_jab', comboTimer: 0.2, chainDepth: 1 };

		expect(resolveNextMeleeMove(base, 'light', player())).toBeNull();
		expect(
			resolveNextMeleeMove(
				{ ...base, unlockedSkills: ['double_swipe'] },
				'light',
				player()
			)?.id
		).toBe('claw_cross');
	});

	it('expires combo state deterministically', () => {
		const expired = decayMeleeCombo(
			{ ...createMeleeComboState(), activeMoveId: 'claw_jab', comboTimer: 0.1, chainDepth: 1 },
			0.2
		);

		expect(expired.activeMoveId).toBeNull();
		expect(expired.chainDepth).toBe(0);
	});

	it('damages enemies and escalates style through a clean combo chain', () => {
		const combo = new MeleeComboSystem(createMeleeComboState(['double_swipe', 'parry_tooth']));
		const badger = player();
		const drone = enemy();
		const events: string[] = [];

		const jab = combo.attack(badger, [drone], 'light', { onEvent: (event) => events.push(event.kind) });
		const cross = combo.attack(badger, [drone], 'light');
		const finisher = combo.attack(badger, [drone], 'finisher');

		expect(jab?.move.id).toBe('claw_jab');
		expect(cross?.move.id).toBe('claw_cross');
		expect(finisher?.move.id).toBe('invoice_splitter');
		expect(drone.hp).toBeLessThan(0);
		expect(combo.getState().chainDepth).toBe(3);
		expect(combo.getState().style).toBeGreaterThan(5);
		expect(events).toContain('hit');
	});

	it('gates finishers behind badger skill tree unlocks', () => {
		const combo = new MeleeComboSystem(createMeleeComboState());
		const badger = player();
		const drone = enemy();

		expect(combo.attack(badger, [drone], 'heavy')?.move.id).toBe('claw_heavy');
		expect(combo.attack(badger, [drone], 'finisher')).toBeNull();

		combo.setUnlockedSkills(['parry_tooth']);
		expect(combo.attack(badger, [drone], 'finisher')?.move.id).toBe('invoice_splitter');
	});

	it('requires airborne state for air extensions', () => {
		const state = { ...createMeleeComboState(), activeMoveId: 'burrow_launcher', comboTimer: 0.2, chainDepth: 1 };

		expect(resolveNextMeleeMove(state, 'air', player({ onGround: true }))?.id).toBeUndefined();
		expect(resolveNextMeleeMove(state, 'air', player({ onGround: false }))?.id).toBe('air_rake');
	});
});
