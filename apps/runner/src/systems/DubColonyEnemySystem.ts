import type { Player } from '../actors/MossBadger';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';
import type { ActionMap } from './InputSystem';

export type DubColonyEnemyAttack = 'static-burst' | 'shield-lunge';

export type DubColonyEnemyEvent =
	| { kind: 'enemy-telegraph'; enemyId: string; attack: DubColonyEnemyAttack }
	| { kind: 'enemy-attack'; enemyId: string; attack: DubColonyEnemyAttack }
	| { kind: 'rhythm-jammed'; enemyId: string; duration: number }
	| { kind: 'guard-talked-down'; enemyId: string };

interface EnemyPatternState {
	mode: 'patrol' | 'windup' | 'attack' | 'recover';
	remaining: number;
	attack: DubColonyEnemyAttack;
	hitApplied: boolean;
}

const states = new WeakMap<CombatEntity, EnemyPatternState>();

function stateFor(enemy: CombatEntity): EnemyPatternState {
	let state = states.get(enemy);
	if (!state) {
		state = {
			mode: 'patrol',
			remaining: 0.4,
			attack: enemy.procgenFamily === 'signal_jammer_bat' ? 'static-burst' : 'shield-lunge',
			hitApplied: false,
		};
		states.set(enemy, state);
	}
	return state;
}

export class DubColonyEnemySystem {
	step(
		enemies: CombatEntity[],
		player: Player,
		action: ActionMap,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): DubColonyEnemyEvent[] {
		const events: DubColonyEnemyEvent[] = [];
		for (const enemy of enemies) {
			if (
				enemy.hp <= 0 ||
				!['signal_jammer_bat', 'feedback_guard'].includes(enemy.procgenFamily ?? '')
			) {
				continue;
			}
			const state = stateFor(enemy);
			enemy.usesPatternController = true;
			enemy.spriteSheetId =
				enemy.procgenFamily === 'signal_jammer_bat'
					? 'enemy_signal_jammer_bat'
					: 'enemy_feedback_guard';

			if (
				enemy.procgenFamily === 'feedback_guard' &&
				state.mode === 'windup' &&
				action.hackPressed &&
				Math.abs(player.x - enemy.x) < 96
			) {
				enemy.hp = 0;
				enemy.vx = 0;
				enemy.faction = 'neutral';
				enemy.spriteAnimation = 'stun_or_parried';
				events.push({ kind: 'guard-talked-down', enemyId: enemy.id ?? 'feedback-guard' });
				continue;
			}

			state.remaining = Math.max(0, state.remaining - Math.max(0, dt));
			switch (state.mode) {
				case 'patrol':
					enemy.dir = player.x < enemy.x ? -1 : 1;
					if (enemy.procgenFamily === 'signal_jammer_bat') {
						enemy.onGround = false;
						enemy.y += Math.sin(performance.now() / 240 + enemy.x) * 0.3;
						enemy.vx = enemy.dir * 18;
					} else {
						enemy.vx = enemy.dir * 28;
					}
					enemy.x += enemy.vx * Math.max(0, dt);
					enemy.spriteAnimation = 'patrol_or_move';
					enemy.aiState = 'patrol';
					enemy.attackTelegraph = 0;
					if (state.remaining === 0 && Math.abs(player.x - enemy.x) < 470) {
						state.mode = 'windup';
						state.remaining = state.attack === 'static-burst' ? 0.72 : 0.55;
						state.hitApplied = false;
						events.push({
							kind: 'enemy-telegraph',
							enemyId: enemy.id ?? 'colony-enemy',
							attack: state.attack,
						});
					}
					break;
				case 'windup':
					enemy.vx = 0;
					enemy.dir = player.x < enemy.x ? -1 : 1;
					enemy.spriteAnimation = 'windup';
					enemy.aiState = 'windup';
					enemy.attackTelegraph = 1 - Math.min(1, state.remaining / 0.72);
					if (state.remaining === 0) {
						state.mode = 'attack';
						state.remaining = state.attack === 'static-burst' ? 0.24 : 0.34;
						events.push({
							kind: 'enemy-attack',
							enemyId: enemy.id ?? 'colony-enemy',
							attack: state.attack,
						});
						if (state.attack === 'static-burst') {
							events.push({
								kind: 'rhythm-jammed',
								enemyId: enemy.id ?? 'jammer-bat',
								duration: 1.15,
							});
						}
					}
					break;
				case 'attack':
					enemy.spriteAnimation = 'attack';
					enemy.aiState = 'attack';
					enemy.attackTelegraph = 0;
					if (state.attack === 'shield-lunge') {
						enemy.vx = enemy.dir * 260;
						enemy.x += enemy.vx * Math.max(0, dt);
					} else {
						enemy.vx = 0;
					}
					if (!state.hitApplied) {
						const hitbox =
							state.attack === 'static-burst'
								? { x: enemy.x - 190, y: enemy.y - 65, w: 380, h: 170 }
								: {
										x: enemy.dir > 0 ? enemy.x : enemy.x - 90,
										y: enemy.y - 6,
										w: enemy.w + 90,
										h: enemy.h + 12,
									};
						const result = combat.resolveAttack(
							enemy,
							[player],
							{
								id: `dub-colony:${state.attack}`,
								source: 'enemy',
								damage: state.attack === 'static-burst' ? 0.75 : 1.2,
								damageType: state.attack === 'static-burst' ? 'shock' : 'blunt',
								stun: state.attack === 'static-burst' ? 0.18 : 0.3,
								knockbackX: state.attack === 'static-burst' ? 90 : 240,
								knockbackY: state.attack === 'static-burst' ? -40 : -100,
								hitbox,
								parryable: state.attack === 'shield-lunge',
							},
							combatEvents
						);
						state.hitApplied = result.hits.length > 0 || result.blocked > 0;
					}
					if (state.remaining === 0) {
						state.mode = 'recover';
						state.remaining = 0.48;
					}
					break;
				case 'recover':
					enemy.vx *= 0.72;
					enemy.spriteAnimation = 'idle';
					enemy.aiState = 'recover';
					if (state.remaining === 0) {
						state.mode = 'patrol';
						state.remaining = enemy.procgenFamily === 'signal_jammer_bat' ? 0.92 : 0.72;
						state.hitApplied = false;
					}
					break;
			}
		}
		return events;
	}
}
