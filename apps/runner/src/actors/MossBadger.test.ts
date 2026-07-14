import { describe, expect, it, vi } from 'vitest';
import type { CombatEntity } from '../systems/CombatSystem';
import type { ActionMap } from '../systems/InputSystem';
import { createPlayer, processMossInput } from './MossBadger';

const IDLE_ACTIONS: ActionMap = {
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

describe('processMossInput', () => {
	it('passes live enemy targets to melee resolution', () => {
		const player = createPlayer();
		const enemies = [{ hp: 3 }] as CombatEntity[];
		const melee = vi.fn();
		const resolveAttack = vi.fn();

		processMossInput(
			player,
			{ ...IDLE_ACTIONS, melee: true, meleePressed: true },
			1 / 60,
			{ melee, resolveAttack },
			enemies
		);

		expect(melee).toHaveBeenCalledWith(player, enemies, 'claws', undefined);
	});

	it('uses a grounded stim before consuming rocket fuel', () => {
		const player = createPlayer();
		Object.assign(player, {
			hasRocket: true,
			fuel: 3,
			maxFuel: 3,
			stims: 1,
			hp: 2,
			onGround: true,
		});

		processMossInput(player, { ...IDLE_ACTIONS, item: true, itemPressed: true }, 1 / 60, {
			melee: vi.fn(),
			resolveAttack: vi.fn(),
		});

		expect(player.hp).toBe(4);
		expect(player.stims).toBe(0);
		expect(player.fuel).toBe(3);
		expect(player.healFlash).toBeGreaterThan(0);
	});

	it('blocks attacks while Moss is stunned', () => {
		const player = createPlayer();
		player.stun = 0.3;
		const melee = vi.fn();

		processMossInput(player, { ...IDLE_ACTIONS, melee: true, meleePressed: true }, 1 / 60, {
			melee,
			resolveAttack: vi.fn(),
		});

		expect(melee).not.toHaveBeenCalled();
	});

	it('fires a real piercing railgun lane with recoil and hit feedback', () => {
		const player = createPlayer();
		player.hasRailgun = true;
		player.dir = 1;
		player.vx = 100;
		const targets = [{ hp: 3 }] as CombatEntity[];
		const resolveAttack = vi.fn(() => ({
			attackId: 'moss:railgun-pierce',
			hits: [{ kind: 'hit' as const }],
			kills: 0,
			blocked: 0,
		}));

		processMossInput(
			player,
			{ ...IDLE_ACTIONS, shoot: true, shootPressed: true },
			1 / 60,
			{ melee: vi.fn(), resolveAttack },
			targets
		);

		expect(resolveAttack).toHaveBeenCalledWith(
			player,
			targets,
			expect.objectContaining({
				id: 'moss:railgun-pierce',
				pierce: 4,
				damagePacket: expect.objectContaining({ armorPierce: 0.7 }),
			}),
			undefined
		);
		expect(player.vx).toBe(62);
		expect(player.railgunFlash).toBeGreaterThan(0);
		expect(player.railgunHitCount).toBe(1);
	});

	it('applies item and skill rail modifiers to the live attack specification', () => {
		const player = createPlayer();
		Object.assign(player, {
			hasRailgun: true,
			dir: 1,
			vx: 100,
			itemSetEffects: {
				railDamageBonus: 0.4,
				railPierceBonus: 2,
				railCooldownReduction: 0.2,
				railRecoilReduction: 0.5,
				empOnChargedShot: true,
			},
		});
		const resolveAttack = vi.fn(() => ({
			attackId: 'moss:railgun-pierce',
			hits: [],
			kills: 0,
			blocked: 0,
		}));

		processMossInput(
			player,
			{ ...IDLE_ACTIONS, shoot: true, shootPressed: true },
			1 / 60,
			{ melee: vi.fn(), resolveAttack },
			[]
		);

		expect(resolveAttack).toHaveBeenCalledWith(
			player,
			[],
			expect.objectContaining({
				damage: 2,
				pierce: 6,
				damagePacket: expect.objectContaining({ amount: 2 }),
				statusOnHit: [expect.objectContaining({ kind: 'emp' })],
			}),
			undefined
		);
		expect(player.shootCd).toBeCloseTo(0.503, 2);
		expect(player.vx).toBe(81);
	});
});
