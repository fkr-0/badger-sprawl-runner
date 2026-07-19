import type { Player } from '../actors/MossBadger';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type MirrorPalaceEnemyState = 'patrol' | 'windup' | 'attack' | 'recovery' | 'stunned';

type MirrorFamily = 'usher' | 'sentinel';
type MirrorAttack = 'applause-lunge' | 'reflection-lane';

interface RuntimeState {
	state: MirrorPalaceEnemyState;
	timer: number;
	cooldown: number;
	spawnX: number;
	attack: MirrorAttack;
	hitApplied: boolean;
	windupDuration: number;
}

export type MirrorPalaceEnemyEvent =
	| { kind: 'enemy-telegraph'; enemyId: string; attack: MirrorAttack }
	| { kind: 'enemy-attack'; enemyId: string; attack: MirrorAttack };

function familyOf(enemy: CombatEntity): MirrorFamily | null {
	if (/banquet_usher|usher/i.test(enemy.procgenFamily ?? '')) return 'usher';
	if (/mirror_sentinel|sentinel/i.test(enemy.procgenFamily ?? '')) return 'sentinel';
	return null;
}

function centerX(entity: CombatEntity): number {
	return entity.x + entity.w / 2;
}

export class MirrorPalaceEnemySystem {
	private readonly runtime = new Map<string, RuntimeState>();

	step(
		enemies: CombatEntity[],
		player: Player,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): MirrorPalaceEnemyEvent[] {
		const events: MirrorPalaceEnemyEvent[] = [];
		for (const enemy of enemies) {
			const family = familyOf(enemy);
			if (!family || enemy.hp <= 0 || enemy.bossId) continue;
			const id = enemy.id ?? `${family}:${enemy.x}`;
			const runtime = this.ensureRuntime(id, enemy, family);
			runtime.timer = Math.max(0, runtime.timer - Math.max(0, dt));
			runtime.cooldown = Math.max(0, runtime.cooldown - Math.max(0, dt));
			enemy.usesPatternController = true;

			if (enemy.stun > 0) {
				runtime.state = 'stunned';
				enemy.vx *= 0.65;
				this.applyPresentation(enemy, runtime, family);
				continue;
			}
			if (runtime.state === 'stunned') this.enterRecovery(runtime, 0.45);

			const dx = centerX(player) - centerX(enemy);
			enemy.dir = dx < 0 ? -1 : 1;
			if (runtime.state === 'windup') {
				enemy.vx = 0;
				if (runtime.timer === 0) {
					runtime.state = 'attack';
					runtime.timer = family === 'usher' ? 0.34 : 0.2;
					runtime.hitApplied = false;
					events.push({ kind: 'enemy-attack', enemyId: id, attack: runtime.attack });
				}
			} else if (runtime.state === 'attack') {
				if (family === 'usher') {
					enemy.vx = enemy.dir * 350;
					enemy.x += enemy.vx * dt;
				}
				this.resolveAttack(enemy, player, runtime, combat, combatEvents);
				if (runtime.timer === 0) this.enterRecovery(runtime, 0.62);
			} else if (runtime.state === 'recovery') {
				enemy.vx *= 0.72;
				if (runtime.timer === 0) runtime.state = 'patrol';
			} else {
				const distance = Math.abs(dx);
				if (distance < (family === 'usher' ? 190 : 520) && runtime.cooldown === 0) {
					runtime.state = 'windup';
					runtime.timer = family === 'usher' ? 0.58 : 0.84;
					runtime.windupDuration = runtime.timer;
					runtime.hitApplied = false;
					events.push({ kind: 'enemy-telegraph', enemyId: id, attack: runtime.attack });
				} else if (family === 'usher') {
					if (enemy.x < runtime.spawnX - 80) enemy.dir = 1;
					if (enemy.x > runtime.spawnX + 80) enemy.dir = -1;
					enemy.vx = enemy.dir * 30;
					enemy.x += enemy.vx * dt;
				} else {
					enemy.vx = 0;
				}
			}
			this.applyPresentation(enemy, runtime, family);
		}
		return events;
	}

	private resolveAttack(
		enemy: CombatEntity,
		player: Player,
		runtime: RuntimeState,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): void {
		if (runtime.hitApplied) return;
		const lunge = runtime.attack === 'applause-lunge';
		const hitbox = lunge
			? { x: enemy.x - 12, y: enemy.y - 5, w: enemy.w + 24, h: enemy.h + 10 }
			: {
					x: enemy.dir > 0 ? enemy.x + enemy.w : enemy.x - 430,
					y: enemy.y + 11,
					w: 430,
					h: 16,
				};
		const result = combat.resolveAttack(
			enemy,
			[player],
			{
				id: `mirror-palace:${runtime.attack}`,
				source: 'enemy',
				damage: lunge ? 1.15 : 1,
				damageType: lunge ? 'blunt' : 'shock',
				stun: lunge ? 0.28 : 0.2,
				knockbackX: lunge ? 250 : 170,
				knockbackY: lunge ? -110 : -70,
				hitbox,
				parryable: lunge,
			},
			combatEvents
		);
		runtime.hitApplied = result.hits.length > 0 || result.blocked > 0;
	}

	private ensureRuntime(id: string, enemy: CombatEntity, family: MirrorFamily): RuntimeState {
		const existing = this.runtime.get(id);
		if (existing) return existing;
		const created: RuntimeState = {
			state: 'patrol',
			timer: 0,
			cooldown: family === 'usher' ? 0.4 : 0.7,
			spawnX: enemy.x,
			attack: family === 'usher' ? 'applause-lunge' : 'reflection-lane',
			hitApplied: false,
			windupDuration: family === 'usher' ? 0.58 : 0.84,
		};
		this.runtime.set(id, created);
		return created;
	}

	private enterRecovery(runtime: RuntimeState, duration: number): void {
		runtime.state = 'recovery';
		runtime.timer = duration;
		runtime.cooldown = duration + 0.5;
		runtime.hitApplied = false;
	}

	private applyPresentation(
		enemy: CombatEntity,
		runtime: RuntimeState,
		family: MirrorFamily
	): void {
		enemy.aiState = runtime.state;
		enemy.attackTelegraph =
			runtime.state === 'windup'
				? 1 - Math.min(1, runtime.timer / Math.max(0.01, runtime.windupDuration))
				: 0;
		enemy.spriteSheetId = family === 'usher' ? 'enemy_chrome_bellhop' : 'enemy_mirror_sentinel';
		enemy.spriteAnimation =
			runtime.state === 'windup'
				? 'windup'
				: runtime.state === 'attack'
					? 'attack'
					: runtime.state === 'stunned'
						? 'stun_or_parried'
						: runtime.state === 'recovery'
							? 'hurt'
							: 'patrol_or_move';
	}
}
