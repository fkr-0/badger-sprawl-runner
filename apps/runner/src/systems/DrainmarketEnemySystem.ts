import type { Player } from '../actors/MossBadger';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type DrainmarketEnemyState =
	| 'patrol'
	| 'chase'
	| 'windup'
	| 'attack'
	| 'recovery'
	| 'stunned';

interface EnemyRuntime {
	state: DrainmarketEnemyState;
	timer: number;
	cooldown: number;
	spawnX: number;
	spawnY: number;
	hitApplied: boolean;
	attack: 'knife-lunge' | 'invoice-cleaver';
	windupDuration: number;
}

export type DrainmarketEnemyEvent =
	| { kind: 'enemy-telegraph'; enemyId: string; attack: string }
	| { kind: 'enemy-attack'; enemyId: string; attack: string };

function centerX(entity: CombatEntity): number {
	return entity.x + entity.w / 2;
}

function familyOf(enemy: CombatEntity): 'knife' | 'collector' | null {
	const family = enemy.procgenFamily ?? '';
	if (/clinic_collector|clinic-repo|collector/i.test(family) || enemy.procgenRole === 'bruiser') {
		return 'collector';
	}
	if (
		/knife_drone|price_tag_wasp|invoice_snare|knife-drone/i.test(family) ||
		['skirmisher', 'ranged', 'trapper'].includes(enemy.procgenRole ?? '')
	) {
		return 'knife';
	}
	return null;
}

export class DrainmarketEnemySystem {
	private readonly runtime = new Map<string, EnemyRuntime>();

	step(
		enemies: CombatEntity[],
		player: Player,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): DrainmarketEnemyEvent[] {
		const events: DrainmarketEnemyEvent[] = [];
		const safeDt = Math.max(0, dt);
		for (const enemy of enemies) {
			const family = familyOf(enemy);
			if (!family || enemy.hp <= 0 || enemy.bossId) continue;
			const id = enemy.id ?? `${family}:${enemy.x}`;
			const runtime = this.ensureRuntime(id, enemy, family);
			enemy.usesPatternController = true;
			runtime.timer = Math.max(0, runtime.timer - safeDt);
			runtime.cooldown = Math.max(0, runtime.cooldown - safeDt);

			if (enemy.stun > 0) {
				runtime.state = 'stunned';
				enemy.vx *= 0.7;
				this.applyPresentation(enemy, runtime, family);
				continue;
			}
			if (runtime.state === 'stunned') this.enterRecovery(runtime, family === 'knife' ? 0.42 : 0.6);

			const dx = centerX(player) - centerX(enemy);
			enemy.dir = dx < 0 ? -1 : 1;
			if (family === 'knife') {
				this.stepKnife(enemy, player, runtime, safeDt, combat, combatEvents, events);
			} else {
				this.stepCollector(enemy, player, runtime, safeDt, combat, combatEvents, events);
			}
			this.applyPresentation(enemy, runtime, family);
		}
		return events;
	}

	private stepKnife(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents: CombatEvents | undefined,
		events: DrainmarketEnemyEvent[]
	): void {
		const distance = Math.abs(centerX(player) - centerX(enemy));
		if (runtime.state === 'windup') {
			enemy.vx = 0;
			if (runtime.timer === 0) this.enterAttack(runtime, enemy, events, 0.24);
			return;
		}
		if (runtime.state === 'attack') {
			enemy.vx = enemy.dir * 345;
			enemy.x += enemy.vx * dt;
			this.resolveAttack(enemy, player, runtime, combat, combatEvents, 1, 215, -95);
			if (runtime.timer === 0) this.enterRecovery(runtime, 0.58);
			return;
		}
		if (runtime.state === 'recovery') {
			enemy.vx *= 0.72;
			if (runtime.timer === 0) runtime.state = 'patrol';
			return;
		}

		if (distance < 190 && runtime.cooldown === 0) {
			this.enterWindup(runtime, enemy, events, 'knife-lunge', 0.56);
			return;
		}
		runtime.state = distance < 360 ? 'chase' : 'patrol';
		if (distance < 360) {
			enemy.vx = enemy.dir * 92;
		} else {
			if (enemy.x < runtime.spawnX - 110) enemy.dir = 1;
			if (enemy.x > runtime.spawnX + 110) enemy.dir = -1;
			enemy.vx = enemy.dir * 48;
		}
		enemy.x += enemy.vx * dt;
		enemy.y = runtime.spawnY + Math.sin((enemy.x + runtime.spawnX) * 0.018) * 5;
	}

	private stepCollector(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents: CombatEvents | undefined,
		events: DrainmarketEnemyEvent[]
	): void {
		const distance = Math.abs(centerX(player) - centerX(enemy));
		if (runtime.state === 'windup') {
			enemy.vx = 0;
			if (runtime.timer === 0) this.enterAttack(runtime, enemy, events, 0.34);
			return;
		}
		if (runtime.state === 'attack') {
			enemy.vx = enemy.dir * 190;
			enemy.x += enemy.vx * dt;
			this.resolveAttack(enemy, player, runtime, combat, combatEvents, 1.25, 245, -120);
			if (runtime.timer === 0) this.enterRecovery(runtime, 0.78);
			return;
		}
		if (runtime.state === 'recovery') {
			enemy.vx *= 0.72;
			if (runtime.timer === 0) runtime.state = 'chase';
			return;
		}

		if (distance < 105 && runtime.cooldown === 0) {
			this.enterWindup(runtime, enemy, events, 'invoice-cleaver', 0.78);
			return;
		}
		runtime.state = distance < 310 ? 'chase' : 'patrol';
		enemy.vx = enemy.dir * (distance < 310 ? 52 : 28);
		enemy.x += enemy.vx * dt;
	}

	private resolveAttack(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents: CombatEvents | undefined,
		damage: number,
		knockbackX: number,
		knockbackY: number
	): void {
		if (runtime.hitApplied) return;
		const result = combat.resolveAttack(
			enemy,
			[player],
			{
				id: `drainmarket:${runtime.attack}`,
				source: 'enemy',
				damage,
				damageType: runtime.attack === 'knife-lunge' ? 'pierce' : 'blunt',
				stun: runtime.attack === 'knife-lunge' ? 0.2 : 0.3,
				knockbackX,
				knockbackY,
				hitbox: { x: enemy.x - 14, y: enemy.y - 8, w: enemy.w + 28, h: enemy.h + 16 },
				parryable: true,
			},
			combatEvents
		);
		runtime.hitApplied = result.hits.length > 0 || result.blocked > 0;
	}

	private ensureRuntime(
		id: string,
		enemy: CombatEntity,
		family: 'knife' | 'collector'
	): EnemyRuntime {
		const existing = this.runtime.get(id);
		if (existing) return existing;
		const created: EnemyRuntime = {
			state: 'patrol',
			timer: 0,
			cooldown: family === 'knife' ? 0.3 : 0.7,
			spawnX: enemy.x,
			spawnY: enemy.y,
			hitApplied: false,
			attack: family === 'knife' ? 'knife-lunge' : 'invoice-cleaver',
			windupDuration: family === 'knife' ? 0.56 : 0.78,
		};
		this.runtime.set(id, created);
		return created;
	}

	private enterWindup(
		runtime: EnemyRuntime,
		enemy: CombatEntity,
		events: DrainmarketEnemyEvent[],
		attack: EnemyRuntime['attack'],
		duration: number
	): void {
		runtime.state = 'windup';
		runtime.timer = duration;
		runtime.windupDuration = duration;
		runtime.attack = attack;
		runtime.hitApplied = false;
		events.push({ kind: 'enemy-telegraph', enemyId: enemy.id ?? 'drainmarket-enemy', attack });
	}

	private enterAttack(
		runtime: EnemyRuntime,
		enemy: CombatEntity,
		events: DrainmarketEnemyEvent[],
		duration: number
	): void {
		runtime.state = 'attack';
		runtime.timer = duration;
		runtime.hitApplied = false;
		events.push({
			kind: 'enemy-attack',
			enemyId: enemy.id ?? 'drainmarket-enemy',
			attack: runtime.attack,
		});
	}

	private enterRecovery(runtime: EnemyRuntime, duration: number): void {
		runtime.state = 'recovery';
		runtime.timer = duration;
		runtime.cooldown = duration + 0.45;
		runtime.hitApplied = false;
	}

	private applyPresentation(
		enemy: CombatEntity,
		runtime: EnemyRuntime,
		family: 'knife' | 'collector'
	): void {
		enemy.aiState = runtime.state;
		enemy.attackTelegraph =
			runtime.state === 'windup'
				? 1 - Math.min(1, runtime.timer / Math.max(0.01, runtime.windupDuration))
				: 0;
		enemy.spriteSheetId = family === 'knife' ? 'enemy_knife_drone' : 'enemy_clinic_repo';
		enemy.spriteAnimation =
			runtime.state === 'windup'
				? 'windup'
				: runtime.state === 'attack'
					? 'attack'
					: runtime.state === 'stunned'
						? 'stun_or_parried'
						: runtime.state === 'recovery'
							? 'hurt'
							: runtime.state === 'patrol' || runtime.state === 'chase'
								? 'patrol_or_move'
								: 'idle';
	}
}
