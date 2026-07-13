import { describe, expect, it } from 'vitest';
import { type AttackSpec, type CombatEntity, CombatSystem } from './CombatSystem';

function entity(overrides: Partial<CombatEntity> = {}): CombatEntity {
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
		hp: 5,
		maxHp: 5,
		invuln: 0,
		stun: 0,
		faction: 'enemy',
		...overrides,
	};
}

describe('CombatSystem deterministic combat', () => {
	it('records deterministic action time without Date.now', () => {
		const system = new CombatSystem();
		const player = entity({ faction: 'player', unlockedSkills: ['parry_tooth'] });
		const drone = entity({ x: 45 });

		system.meleeInput(player, [drone], 'light', undefined, 12.5);

		expect(system.getLastAction()).toEqual({ kind: 'melee', time: 12.5, moveId: 'claw_jab' });
		expect(player.lastHitTime).toBe(12.5);
	});

	it('resolves armor, poise break, combo gain, and kill events from attack specs', () => {
		const system = new CombatSystem();
		const player = entity({ faction: 'player' });
		const armored = entity({ x: 20, hp: 3, armor: 0.5, poise: 1 });
		const events: string[] = [];
		const attack: AttackSpec = {
			id: 'rail-poke',
			source: 'player',
			damage: 2,
			stun: 0.2,
			poiseDamage: 1,
			knockbackX: 40,
			hitbox: { x: 10, y: 0, w: 60, h: 40 },
			comboGain: 2,
		};

		const result = system.resolveAttack(
			player,
			[armored],
			attack,
			{ onEvent: (event) => events.push(event.kind) },
			3
		);

		expect(result.hits.map((hit) => hit.kind)).toContain('hit');
		expect(events).toContain('poise-break');
		expect(armored.hp).toBe(1.5);
		expect(armored.poise).toBe(0);
		expect(player.comboCount).toBe(2);
		expect(player.comboTimer).toBeGreaterThan(0);
	});

	it('uses typed damage packets with resistances and vulnerabilities in attack resolution', () => {
		const system = new CombatSystem();
		const player = entity({ faction: 'player' });
		const drone = entity({
			x: 20,
			hp: 10,
			armor: 2,
			resistances: { slash: 0.5 },
			vulnerabilities: { slash: 0.25 },
		});

		const result = system.resolveAttack(
			player,
			[drone],
			{
				id: 'typed-slash',
				source: 'player',
				damage: 10,
				damagePacket: { amount: 10, type: 'slash', armorPierce: 1, crit: true, critMultiplier: 2 },
				stun: 0.1,
				knockbackX: 0,
				hitbox: { x: 0, y: 0, w: 80, h: 80 },
			},
			undefined,
			6
		);

		expect(result.hits[0]?.damage).toBe(14.25);
		expect(drone.hp).toBe(-4.25);
	});

	it('lets parry windows block parryable attacks and stun attackers', () => {
		const system = new CombatSystem();
		const enemy = entity({ faction: 'enemy' });
		const player = entity({ faction: 'player', parryWindow: 0.1 });

		const result = system.resolveAttack(enemy, [player], {
			id: 'knife-lunge',
			source: 'enemy',
			damage: 2,
			stun: 0.3,
			knockbackX: 100,
			hitbox: { x: -5, y: 0, w: 50, h: 40 },
			parryable: true,
		});

		expect(result.blocked).toBe(1);
		expect(result.hits[0]?.kind).toBe('parry');
		expect(enemy.stun).toBeGreaterThan(0);
		expect(player.hp).toBe(5);
	});

	it('applies status-on-hit and ticks status damage during later combat steps', () => {
		const system = new CombatSystem();
		const player = entity({ faction: 'player' });
		const drone = entity({ id: 'drone' } as Partial<CombatEntity>);
		const statuses: string[] = [];

		system.resolveAttack(
			player,
			[drone],
			{
				id: 'burning-claw',
				source: 'player',
				damage: 1,
				stun: 0.1,
				knockbackX: 0,
				hitbox: { x: -5, y: -5, w: 80, h: 80 },
				statusOnHit: [
					{
						id: 'burning-claw-dot',
						kind: 'burn',
						sourceId: 'player',
						duration: 1,
						remaining: 1,
						stacks: 1,
						maxStacks: 2,
						tickInterval: 0.5,
						tickTimer: 0.5,
						magnitude: 1,
					},
				],
			},
			{
				onEvent: (event) => {
					if (event.status) statuses.push(event.status.kind);
				},
			},
			4
		);

		expect(drone.statusEffects?.[0]?.kind).toBe('burn');
		system.step(
			player,
			[drone],
			{},
			0.5,
			{
				onEvent: (event) => {
					if (event.status) statuses.push(event.status.kind);
				},
			},
			{ time: 4.5 }
		);

		expect(drone.hp).toBe(3);
		expect(statuses).toContain('applied');
		expect(statuses).toContain('tick');
	});

	it('applies item set mitigation and parry bonuses during collision combat', () => {
		const system = new CombatSystem();
		const player = entity({
			faction: 'player',
			itemSetEffects: { damageMitigation: 0.25, parryWindowBonus: 0.05 },
		});
		const enemy = entity({ x: 10 });
		const distantEnemy = entity({ x: 200 });

		system.step(player, [distantEnemy], { parryPressed: true }, 0.016, undefined, { time: 1 });
		expect(player.parryWindow).toBeCloseTo(0.2);

		player.parryWindow = 0;
		player.parryCooldown = 1;
		system.step(player, [enemy], {}, 0.016, undefined, { time: 2 });
		expect(player.hp).toBe(4.25);
	});

	it('turns a grounded dodge into a fast invulnerable movement burst', () => {
		const system = new CombatSystem();
		const player = entity({ faction: 'player', dir: -1, vx: 20 });

		system.step(player, [], { dodgePressed: true }, 0.016, undefined, { time: 3 });

		expect(player.isDodging).toBe(true);
		expect(player.invuln).toBeGreaterThanOrEqual(0.3);
		expect(player.vx).toBeLessThanOrEqual(-430);
		expect(player.vy).toBeLessThan(0);
	});

	it('grants brief damage grace after an explicit enemy attack', () => {
		const system = new CombatSystem();
		const attacker = entity({ faction: 'enemy' });
		const player = entity({ faction: 'player' });
		const attack: AttackSpec = {
			id: 'toll-swipe',
			source: 'enemy',
			damage: 1,
			stun: 0.2,
			knockbackX: 40,
			hitbox: { x: -10, y: -10, w: 80, h: 80 },
		};

		const first = system.resolveAttack(attacker, [player], attack);
		const second = system.resolveAttack(attacker, [player], attack);

		expect(first.hits).toHaveLength(1);
		expect(player.invuln).toBeGreaterThanOrEqual(0.5);
		expect(second.hits).toHaveLength(0);
		expect(player.hp).toBe(4);
	});
});
