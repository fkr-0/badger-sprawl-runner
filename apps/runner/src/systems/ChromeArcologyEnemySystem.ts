import type { Player } from '../actors/MossBadger';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type ChromeArcologyEnemyState =
	| 'patrol'
	| 'chase'
	| 'windup'
	| 'attack'
	| 'recovery'
	| 'stunned';

type ArcologyEnemyFamily = 'bellhop' | 'sentinel';
type ArcologyEnemyAttack = 'luggage-dash' | 'prism-lane';

interface EnemyRuntime {
	state: ChromeArcologyEnemyState;
	timer: number;
	cooldown: number;
	spawnX: number;
	hitApplied: boolean;
	attack: ArcologyEnemyAttack;
	windupDuration: number;
}

export type ChromeArcologyEnemyEvent =
	| { kind: 'enemy-telegraph'; enemyId: string; attack: ArcologyEnemyAttack }
	| { kind: 'enemy-attack'; enemyId: string; attack: ArcologyEnemyAttack };

function centerX(entity: CombatEntity): number {
	return entity.x + entity.w / 2;
}

function familyOf(enemy: CombatEntity): ArcologyEnemyFamily | null {
	const family = enemy.procgenFamily ?? '';
	if (/chrome_bellhop|bellhop|compliance_shield/i.test(family)) return 'bellhop';
	if (/mirror_sentinel|sentinel|contract_drone/i.test(family)) return 'sentinel';
	return null;
}

export class ChromeArcologyEnemySystem {
	private readonly runtime = new Map<string, EnemyRuntime>();

	step(
		enemies: CombatEntity[],
		player: Player,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): ChromeArcologyEnemyEvent[] {
		const events: ChromeArcologyEnemyEvent[] = [];
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
				enemy.vx *= 0.64;
				this.applyPresentation(enemy, runtime, family);
				continue;
			}
			if (runtime.state === 'stunned') this.enterRecovery(runtime, 0.52);

			const dx = centerX(player) - centerX(enemy);
			enemy.dir = dx < 0 ? -1 : 1;
			if (family === 'bellhop') {
				this.stepBellhop(enemy, player, runtime, safeDt, combat, combatEvents, events);
			} else {
				this.stepSentinel(enemy, player, runtime, combat, combatEvents, events);
			}
			this.applyPresentation(enemy, runtime, family);
		}
		return events;
	}

	private stepBellhop(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents: CombatEvents | undefined,
		events: ChromeArcologyEnemyEvent[]
	): void {
		const distance = Math.abs(centerX(player) - centerX(enemy));
		if (runtime.state === 'windup') {
			enemy.vx = 0;
			if (runtime.timer === 0) this.enterAttack(runtime, enemy, events, 0.34);
			return;
		}
		if (runtime.state === 'attack') {
			enemy.vx = enemy.dir * 330;
			enemy.x += enemy.vx * dt;
			this.resolveAttack(enemy, player, runtime, combat, combatEvents);
			if (runtime.timer === 0) this.enterRecovery(runtime, 0.68);
			return;
		}
		if (runtime.state === 'recovery') {
			enemy.vx *= 0.7;
			if (runtime.timer === 0) runtime.state = 'patrol';
			return;
		}

		if (distance < 180 && runtime.cooldown === 0) {
			this.enterWindup(runtime, enemy, events, 'luggage-dash', 0.66);
			return;
		}
		runtime.state = distance < 390 ? 'chase' : 'patrol';
		if (distance < 390) {
			enemy.vx = enemy.dir * 68;
		} else {
			if (enemy.x < runtime.spawnX - 90) enemy.dir = 1;
			if (enemy.x > runtime.spawnX + 90) enemy.dir = -1;
			enemy.vx = enemy.dir * 32;
		}
		enemy.x += enemy.vx * dt;
	}

	private stepSentinel(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents: CombatEvents | undefined,
		events: ChromeArcologyEnemyEvent[]
	): void {
		const distance = Math.abs(centerX(player) - centerX(enemy));
		enemy.vx = 0;
		if (runtime.state === 'windup') {
			if (runtime.timer === 0) this.enterAttack(runtime, enemy, events, 0.18);
			return;
		}
		if (runtime.state === 'attack') {
			this.resolveAttack(enemy, player, runtime, combat, combatEvents);
			if (runtime.timer === 0) this.enterRecovery(runtime, 0.82);
			return;
		}
		if (runtime.state === 'recovery') {
			if (runtime.timer === 0) runtime.state = 'patrol';
			return;
		}
		if (distance < 540 && runtime.cooldown === 0) {
			this.enterWindup(runtime, enemy, events, 'prism-lane', 0.88);
		} else {
			runtime.state = 'patrol';
		}
	}

	private resolveAttack(
		enemy: CombatEntity,
		player: Player,
		runtime: EnemyRuntime,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): void {
		if (runtime.hitApplied) return;
		const attack = runtime.attack;
		const hitbox =
			attack === 'luggage-dash'
				? { x: enemy.x - 12, y: enemy.y - 6, w: enemy.w + 24, h: enemy.h + 12 }
				: {
						x: enemy.dir > 0 ? enemy.x + enemy.w : enemy.x - 380,
						y: enemy.y + 8,
						w: 380,
						h: 18,
					};
		const result = combat.resolveAttack(
			enemy,
			[player],
			{
				id: `chrome-arcology:${attack}`,
				source: 'enemy',
				damage: attack === 'luggage-dash' ? 1.1 : 1,
				damageType: attack === 'luggage-dash' ? 'blunt' : 'shock',
				stun: attack === 'luggage-dash' ? 0.26 : 0.2,
				knockbackX: attack === 'luggage-dash' ? 250 : 165,
				knockbackY: attack === 'luggage-dash' ? -105 : -70,
				hitbox,
				parryable: attack === 'luggage-dash',
			},
			combatEvents
		);
		runtime.hitApplied = result.hits.length > 0 || result.blocked > 0;
	}

	private ensureRuntime(
		id: string,
		enemy: CombatEntity,
		family: ArcologyEnemyFamily
	): EnemyRuntime {
		const existing = this.runtime.get(id);
		if (existing) return existing;
		const created: EnemyRuntime = {
			state: 'patrol',
			timer: 0,
			cooldown: family === 'bellhop' ? 0.35 : 0.75,
			spawnX: enemy.x,
			hitApplied: false,
			attack: family === 'bellhop' ? 'luggage-dash' : 'prism-lane',
			windupDuration: family === 'bellhop' ? 0.66 : 0.88,
		};
		this.runtime.set(id, created);
		return created;
	}

	private enterWindup(
		runtime: EnemyRuntime,
		enemy: CombatEntity,
		events: ChromeArcologyEnemyEvent[],
		attack: ArcologyEnemyAttack,
		duration: number
	): void {
		runtime.state = 'windup';
		runtime.timer = duration;
		runtime.windupDuration = duration;
		runtime.attack = attack;
		runtime.hitApplied = false;
		events.push({ kind: 'enemy-telegraph', enemyId: enemy.id ?? 'arcology-enemy', attack });
	}

	private enterAttack(
		runtime: EnemyRuntime,
		enemy: CombatEntity,
		events: ChromeArcologyEnemyEvent[],
		duration: number
	): void {
		runtime.state = 'attack';
		runtime.timer = duration;
		runtime.hitApplied = false;
		events.push({
			kind: 'enemy-attack',
			enemyId: enemy.id ?? 'arcology-enemy',
			attack: runtime.attack,
		});
	}

	private enterRecovery(runtime: EnemyRuntime, duration: number): void {
		runtime.state = 'recovery';
		runtime.timer = duration;
		runtime.cooldown = duration + 0.5;
		runtime.hitApplied = false;
	}

	private applyPresentation(
		enemy: CombatEntity,
		runtime: EnemyRuntime,
		family: ArcologyEnemyFamily
	): void {
		enemy.aiState = runtime.state;
		enemy.attackTelegraph =
			runtime.state === 'windup'
				? 1 - Math.min(1, runtime.timer / Math.max(0.01, runtime.windupDuration))
				: 0;
		enemy.spriteSheetId = family === 'bellhop' ? 'enemy_chrome_bellhop' : 'enemy_mirror_sentinel';
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
