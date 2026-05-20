import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { CompanionSystem } from './CompanionSystem';

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
