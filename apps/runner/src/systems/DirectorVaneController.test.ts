import { describe, expect, it } from 'vitest';
import type { CombatEntity } from './CombatSystem';
import type { ActionMap } from './InputSystem';
import { DirectorVaneController } from './DirectorVaneController';

function boss(hp = 100): CombatEntity {
	return {
		id: 'director-vane',
		bossId: 'director-vane',
		x: 100,
		y: 100,
		w: 64,
		h: 96,
		vx: 0,
		vy: 0,
		dir: -1,
		hp,
		maxHp: 100,
		stun: 0,
		invuln: 0,
		onGround: true,
	};
}

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

const coalition = {
	witnessCount: 0,
	coalitionEvidenceCount: 5,
	doctrineGrounded: false,
};

describe('DirectorVaneController', () => {
	it('lets accumulated coalition evidence erode the competence monologue', () => {
		const controller = new DirectorVaneController();
		const vane = boss();
		expect(controller.step(vane, null, action(), 2, coalition)).toContainEqual({
			kind: 'vane-phase-transition',
			phaseIndex: 0,
			action: 'competence-proof',
		});

		expect(controller.getSnapshot()).toMatchObject({
			action: 'competence-proof',
			phaseIndex: 0,
			coalitionEvidenceCount: 5,
		});
		expect(controller.getSnapshot().commandIntegrity).toBeLessThan(1);
	});

	it('uses a minimum graph coloring as a visible route-lock cycle, not a random gate', () => {
		const controller = new DirectorVaneController();
		const vane = boss(70);
		const events = controller.step(vane, null, action(), 1, coalition);
		const snapshot = controller.getSnapshot();

		expect(events).toContainEqual(
			expect.objectContaining({ kind: 'vane-phase-transition', action: 'chromatic-lock' })
		);
		expect(snapshot).toMatchObject({
			action: 'chromatic-lock',
			phaseIndex: 1,
			colorCount: 2,
			activeColor: expect.any(Number),
		});
	});

	it('closes Vane’s completeness claim through a reproducible contradiction proof', () => {
		const controller = new DirectorVaneController();
		const vane = boss(45);
		const events = controller.step(vane, null, action({ hack: true, hackPressed: true }), 1 / 60, coalition);

		expect(events).toContainEqual(
			expect.objectContaining({
				kind: 'vane-contradiction-closed',
				proofTrace: expect.arrayContaining([expect.stringContaining('Contradiction')]),
			})
		);
		expect(controller.getSnapshot()).toMatchObject({
			action: 'counterclaim',
			contradictionClosed: true,
		});
	});

	it('makes witnesses interrupt ownership while an ungrounded doctrine loses broadcast integrity', () => {
		const controller = new DirectorVaneController();
		const vane = boss(20);
		const events = controller.step(vane, null, action(), 3, {
			witnessCount: 4,
			coalitionEvidenceCount: 7,
			doctrineGrounded: false,
		});

		expect(events).toContainEqual({ kind: 'vane-witness-interruption', count: 4 });
		expect(events).toContainEqual({ kind: 'vane-doctrine-unprotected' });
		expect(controller.getSnapshot()).toMatchObject({
			action: 'ownership-collapse',
			witnessInterruptions: 4,
		});
		expect(controller.getSnapshot().broadcastIntegrity).toBeLessThan(0.5);
	});

	it('emits defeat once and leaves the command channel without an owner', () => {
		const controller = new DirectorVaneController();
		const vane = boss(0);
		expect(controller.step(vane, null, action(), 0, coalition)).toEqual([
			{ kind: 'vane-defeated' },
		]);
		expect(controller.step(vane, null, action(), 0, coalition)).toEqual([]);
		expect(controller.getSnapshot()).toMatchObject({ action: 'defeated' });
	});
});
