import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import { BossPhaseSystem } from './BossPhaseSystem';
import type { CombatEntity } from './CombatSystem';

function boss(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		x: 240,
		y: 400,
		w: 48,
		h: 48,
		vx: 0,
		vy: 0,
		dir: -1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 6,
		maxHp: 6,
		invuln: 0,
		stun: 0,
		...overrides,
	};
}

const phases = [
	{ id: 'display-window', label: 'Display Window', mechanic: 'mirror parry counter' },
	{ id: 'laser-tax', label: 'Laser Tax', mechanic: 'laser surge pattern' },
	{ id: 'drone-contract', label: 'Drone Contract', mechanic: 'summon cargo drones' },
];

describe('BossPhaseSystem', () => {
	it('selects phase by boss health ratio', () => {
		const system = new BossPhaseSystem(phases);
		expect(system.step(createPlayer(), [boss({ hp: 6 })], 0.016)?.activePhaseId).toBe(
			'display-window'
		);
		expect(system.step(createPlayer(), [boss({ hp: 3 })], 0.016)?.activePhaseId).toBe('laser-tax');
		expect(system.step(createPlayer(), [boss({ hp: 1 })], 0.016)?.activePhaseId).toBe(
			'drone-contract'
		);
	});

	it('applies readable phase metadata and combat pressure to boss entities', () => {
		const entity = boss({ hp: 6, parryWindow: 0 });
		const state = new BossPhaseSystem(phases).step(createPlayer(), [entity], 0.016);
		expect(state).toMatchObject({
			activePhaseLabel: 'Display Window',
			phaseCount: 3,
		});
		expect(entity.bossPhaseLabel).toBe('Display Window');
		expect(entity.bossPhaseMechanic).toContain('parry');
		expect(entity.parryWindow).toBeGreaterThan(0);
	});

	it('clears state when no live boss is present', () => {
		const system = new BossPhaseSystem(phases);
		system.step(createPlayer(), [boss({ hp: 6 })], 0.016);
		expect(system.step(createPlayer(), [boss({ hp: 0 })], 0.016)).toBeNull();
		expect(system.getState()).toBeNull();
	});

	it('prefers the explicitly tagged boss over ordinary multi-hit enemies', () => {
		const ordinary = boss({ hp: 2, maxHp: 2 });
		const captain = boss({ hp: 3, maxHp: 6, bossId: 'captain-grin' });
		const state = new BossPhaseSystem(phases).step(createPlayer(), [ordinary, captain], 0.016);

		expect(state?.activePhaseId).toBe('laser-tax');
		expect(captain.bossPhaseLabel).toBe('Laser Tax');
		expect(ordinary.bossPhaseLabel).toBeUndefined();
	});
});
