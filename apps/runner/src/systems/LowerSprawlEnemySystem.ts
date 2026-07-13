import type { Player } from '../actors/MossBadger';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type LowerSprawlEnemyState =
	| 'patrol'
	| 'chase'
	| 'windup'
	| 'attack'
	| 'recovery'
	| 'stunned';

interface EnemyRuntime {
	state: LowerSprawlEnemyState;
	timer: number;
	cooldown: number;
	spawnX: number;
	hitApplied: boolean;
}

export type LowerSprawlEnemyEvent =
	| { kind: 'enemy-telegraph'; enemyId: string; attack: string }
	| { kind: 'enemy-attack'; enemyId: string; attack: string };

function roleOf(enemy: CombatEntity): 'patrol' | 'turret' | 'bruiser' | null {
	if (enemy.procgenRole === 'patrol') return 'patrol';
	if (enemy.procgenRole === 'turret') return 'turret';
	if (enemy.procgenRole === 'bruiser') return 'bruiser';
	return null;
}

function centerX(entity: CombatEntity): number {
	return entity.x + entity.w / 2;
}

export class LowerSprawlEnemySystem {
	private readonly runtime = new Map<string, EnemyRuntime>();

	step(
		enemies: CombatEntity[],
		player: Player,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): LowerSprawlEnemyEvent[] {
		const events: LowerSprawlEnemyEvent[] = [];
		const safeDt = Math.max(0, dt);
		for (const enemy of enemies) {
			const role = roleOf(enemy);
			if (!role || enemy.hp <= 0 || enemy.bossId) continue;
			const id = enemy.id ?? `${role}:${enemy.x}`;
			const runtime = this.ensureRuntime(id, enemy);
			enemy.usesPatternController = true;
			runtime.timer = Math.max(0, runtime.timer - safeDt);
			runtime.cooldown = Math.max(0, runtime.cooldown - safeDt);

			if (enemy.stun > 0) {
				runtime.state = 'stunned';
				enemy.vx *= 0.72;
				this.applyPresentation(enemy, runtime);
				continue;
			}
			if (runtime.state === 'stunned') this.enterRecovery(runtime, 0.25);

			const dx = centerX(player) - centerX(enemy);
			enemy.dir = dx < 0 ? -1 : 1;
			if (role === 'turret') this.stepTurret(enemy, player, runtime, combat, combatEvents, events);
			else if (role === 'bruiser') {
				this.stepBruiser(enemy, player, runtime, safeDt, combat, combatEvents, events);
			} else {
				this.stepPatrol(enemy, player, runtime, safeDt, combat, combatEvents, events);
			}

			this.applyPresentation(enemy, runtime);
		}
		return events;
	}

	private stepPatrol(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents: CombatEvents | undefined,
		events: LowerSprawlEnemyEvent[]
	): void {
		const distance = Math.abs(centerX(player) - centerX(enemy));
		if (runtime.state === 'windup') {
			enemy.vx = 0;
			if (runtime.timer === 0) this.enterAttack(runtime, events, enemy, 'toll-swipe', 0.18);
			return;
		}
		if (runtime.state === 'attack') {
			enemy.vx = enemy.dir * 160;
			enemy.x += enemy.vx * dt;
			this.resolveMelee(enemy, player, runtime, combat, combatEvents, 'toll-swipe', 1, 130, -65);
			if (runtime.timer === 0) this.enterRecovery(runtime, 0.42);
			return;
		}
		if (runtime.state === 'recovery') {
			enemy.vx *= 0.78;
			if (runtime.timer === 0) runtime.state = 'patrol';
			return;
		}

		if (distance < 58 && runtime.cooldown === 0) {
			this.enterWindup(runtime, events, enemy, 'toll-swipe', 0.3);
			return;
		}
		const chasing = distance < 230;
		runtime.state = chasing ? 'chase' : 'patrol';
		if (chasing) enemy.vx = enemy.dir * 72;
		else {
			if (enemy.x < runtime.spawnX - 90) enemy.dir = 1;
			if (enemy.x > runtime.spawnX + 90) enemy.dir = -1;
			enemy.vx = enemy.dir * 42;
		}
		enemy.x += enemy.vx * dt;
	}

	private stepBruiser(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents: CombatEvents | undefined,
		events: LowerSprawlEnemyEvent[]
	): void {
		const distance = Math.abs(centerX(player) - centerX(enemy));
		if (runtime.state === 'windup') {
			enemy.vx = 0;
			if (runtime.timer === 0) this.enterAttack(runtime, events, enemy, 'receipt-lunge', 0.28);
			return;
		}
		if (runtime.state === 'attack') {
			enemy.vx = enemy.dir * 245;
			enemy.x += enemy.vx * dt;
			this.resolveMelee(
				enemy,
				player,
				runtime,
				combat,
				combatEvents,
				'receipt-lunge',
				1.25,
				220,
				-105
			);
			if (runtime.timer === 0) this.enterRecovery(runtime, 0.62);
			return;
		}
		if (runtime.state === 'recovery') {
			enemy.vx *= 0.74;
			if (runtime.timer === 0) runtime.state = 'chase';
			return;
		}

		if (distance < 96 && runtime.cooldown === 0) {
			this.enterWindup(runtime, events, enemy, 'receipt-lunge', 0.52);
			return;
		}
		runtime.state = distance < 330 ? 'chase' : 'patrol';
		enemy.vx = enemy.dir * (distance < 330 ? 58 : 30);
		enemy.x += enemy.vx * dt;
	}

	private stepTurret(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents: CombatEvents | undefined,
		events: LowerSprawlEnemyEvent[]
	): void {
		const distance = Math.abs(centerX(player) - centerX(enemy));
		enemy.vx = 0;
		if (runtime.state === 'windup') {
			if (runtime.timer === 0) this.enterAttack(runtime, events, enemy, 'meter-pulse', 0.12);
			return;
		}
		if (runtime.state === 'attack') {
			if (!runtime.hitApplied) {
				const width = 300;
				const hitbox = {
					x: enemy.dir > 0 ? enemy.x + enemy.w : enemy.x - width,
					y: enemy.y + 5,
					w: width,
					h: enemy.h - 10,
				};
				const result = combat.resolveAttack(
					enemy,
					[player],
					{
						id: 'meter-pulse',
						source: 'enemy',
						damage: 0.75,
						damageType: 'shock',
						stun: 0.22,
						knockbackX: 150,
						knockbackY: -70,
						hitbox,
						parryable: true,
					},
					combatEvents
				);
				runtime.hitApplied = result.hits.length > 0 || result.blocked > 0;
			}
			if (runtime.timer === 0) this.enterRecovery(runtime, 0.75);
			return;
		}
		if (runtime.state === 'recovery') {
			if (runtime.timer === 0) runtime.state = 'patrol';
			return;
		}
		if (distance < 420 && runtime.cooldown === 0) {
			this.enterWindup(runtime, events, enemy, 'meter-pulse', 0.7);
		}
	}

	private resolveMelee(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents: CombatEvents | undefined,
		attackId: string,
		damage: number,
		knockbackX: number,
		knockbackY: number
	): void {
		if (runtime.hitApplied) return;
		const result = combat.resolveAttack(
			enemy,
			[player],
			{
				id: attackId,
				source: 'enemy',
				damage,
				damageType: 'blunt',
				stun: 0.2,
				knockbackX,
				knockbackY,
				hitbox: { x: enemy.x - 10, y: enemy.y - 4, w: enemy.w + 20, h: enemy.h + 8 },
				parryable: true,
			},
			combatEvents
		);
		runtime.hitApplied = result.hits.length > 0 || result.blocked > 0;
	}

	private enterWindup(
		runtime: EnemyRuntime,
		events: LowerSprawlEnemyEvent[],
		enemy: CombatEntity,
		attack: string,
		duration: number
	): void {
		runtime.state = 'windup';
		runtime.timer = duration;
		runtime.hitApplied = false;
		events.push({ kind: 'enemy-telegraph', enemyId: enemy.id ?? 'enemy', attack });
	}

	private enterAttack(
		runtime: EnemyRuntime,
		events: LowerSprawlEnemyEvent[],
		enemy: CombatEntity,
		attack: string,
		duration: number
	): void {
		runtime.state = 'attack';
		runtime.timer = duration;
		runtime.hitApplied = false;
		events.push({ kind: 'enemy-attack', enemyId: enemy.id ?? 'enemy', attack });
	}

	private enterRecovery(runtime: EnemyRuntime, duration: number): void {
		runtime.state = 'recovery';
		runtime.timer = duration;
		runtime.cooldown = Math.max(runtime.cooldown, duration + 0.45);
		runtime.hitApplied = false;
	}

	private applyPresentation(enemy: CombatEntity, runtime: EnemyRuntime): void {
		enemy.aiState = runtime.state;
		enemy.attackTelegraph = runtime.state === 'windup' ? 1 - Math.min(1, runtime.timer / 0.7) : 0;
	}

	private ensureRuntime(id: string, enemy: CombatEntity): EnemyRuntime {
		const existing = this.runtime.get(id);
		if (existing) return existing;
		const created: EnemyRuntime = {
			state: 'patrol',
			timer: 0,
			cooldown: 0.45,
			spawnX: enemy.x,
			hitApplied: false,
		};
		this.runtime.set(id, created);
		return created;
	}
}
