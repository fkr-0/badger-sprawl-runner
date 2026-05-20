import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { CompanionSystem, resolveCompanionGameplayModifiers } from './CompanionSystem';

function enemy(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		x: 120,
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
		invuln: 0,
		stun: 0,
		...overrides,
	};
}

describe('CompanionSystem', () => {

	it('resolves branch gameplay hooks into concrete companion modifiers', () => {
		const modifiers = resolveCompanionGameplayModifiers([
			'naya_shield_bonus',
			'ambush_warning_overlay',
			'companion_assist_ready',
		]);
		expect(modifiers).toMatchObject({
			nayaShieldBonus: 1,
			rookOverlayBonusSeconds: 0.9,
			assistHintLeadSeconds: 1.4,
			ambushWarningOverlay: true,
		});
	});

	it('applies Naya shield bonus and ambush overlay modifiers at runtime', () => {
		const system = new CompanionSystem(
			['naya_root', 'rook_null', 'auntie_subharmonic'],
			resolveCompanionGameplayModifiers(['naya_shield_bonus', 'ambush_warning_overlay'])
		);
		system.step(createPlayer(), [enemy()], 0.016);
		expect(system.getState().nayaShield).toBeGreaterThan(2);
		expect(system.getState().rookOverlayUntil).toBeGreaterThan(1.6);
		expect(system.getState().auntieHint).toContain('ambush');
	});

	it('Naya shield mitigates incoming damage before HP loss', () => {
		const system = new CompanionSystem(['naya_root']);
		let blocked = 0;
		expect(
			system.mitigateDamage(1, {
				onShield: (amount) => {
					blocked = amount;
				},
			})
		).toBe(0);
		expect(blocked).toBe(1);
		expect(system.getState().nayaShield).toBe(1);
	});

	it('Rook overlay marks active enemies while enemies remain alive', () => {
		const system = new CompanionSystem(['rook_null']);
		let overlayCount = 0;
		system.step(createPlayer(), [enemy()], 0.016, { onOverlay: () => overlayCount++ });
		expect(system.getState().rookOverlayUntil).toBeGreaterThan(0);
		expect(overlayCount).toBe(1);
	});

	it('Auntie produces contextual hint text', () => {
		const player = createPlayer();
		player.hp = 1;
		const system = new CompanionSystem(['auntie_subharmonic']);
		let hint = '';
		system.step(player, [], 4, {
			onHint: (message) => {
				hint = message;
			},
		});
		expect(hint).toContain('stim');
		expect(system.getState().auntieHint).toContain('stim');
	});
});
