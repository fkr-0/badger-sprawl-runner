import type { Player } from '../actors/MossBadger';
import {
	STORY_ENCOUNTER_READINESS_PROFILE,
	type EncounterReadinessProfile,
} from '../game/GameplayTuning';
import type { CombatEntity } from './CombatSystem';

export type EnemyReadinessState = 'off-guard' | 'routine' | 'alert' | 'engaged';
export type EnemyDisposition = Exclude<EnemyReadinessState, 'engaged'>;

export interface EncounterNoticeEvidence {
	visible: boolean;
	confidence: number;
}

function stableEnemyId(enemy: CombatEntity, index: number): string {
	return enemy.id ?? `${enemy.procgenFamily ?? enemy.procgenRole ?? 'enemy'}:${index}`;
}

interface EnemyReadinessRuntime {
	disposition: EnemyDisposition;
	state: EnemyReadinessState;
	notice: number;
	spawnX: number;
	direction: -1 | 1;
}

/**
 * Transitional encounter-layer boundary for Phase 1.
 *
 * It prevents enemies from entering combat controllers merely because a scene
 * loaded. The later stealth system can replace its detection heuristic while
 * preserving the same `engaged` contract consumed by combat controllers.
 */
export class EncounterReadinessSystem {
	private readonly runtime = new Map<string, EnemyReadinessRuntime>();

	constructor(
		private readonly profile: EncounterReadinessProfile = STORY_ENCOUNTER_READINESS_PROFILE
	) {}

	step(
		enemies: CombatEntity[],
		player: Player,
		dt: number,
		evidenceByEnemyId?: ReadonlyMap<string, EncounterNoticeEvidence>
	): CombatEntity[] {
		const active: CombatEntity[] = [];
		for (const [index, enemy] of enemies.entries()) {
			if (enemy.hp <= 0) continue;
			const runtime = this.ensureRuntime(enemy, index);
			if (enemy.isDummy) runtime.state = 'engaged';
			if (enemy.stun > 0 || enemy.invuln > 0.08) runtime.state = 'engaged';

			if (runtime.state !== 'engaged') {
				if (evidenceByEnemyId) {
					const id = stableEnemyId(enemy, index);
					this.stepNoticeFromEvidence(
						runtime,
						evidenceByEnemyId.get(id),
						Math.max(0, dt)
					);
				} else {
					this.stepNotice(runtime, enemy, player, Math.max(0, dt));
				}
				if (!enemy.perceptionState || enemy.perceptionState === 'calm') {
					this.stepCalmBehavior(runtime, enemy, Math.max(0, dt));
				}
			}

			enemy.awarenessDisposition = runtime.disposition;
			enemy.awarenessState = runtime.state;
			enemy.awarenessLevel = runtime.state === 'engaged' ? 1 : runtime.notice;
			if (runtime.state === 'engaged') active.push(enemy);
		}
		return active;
	}

	private stepNoticeFromEvidence(
		runtime: EnemyReadinessRuntime,
		evidence: EncounterNoticeEvidence | undefined,
		dt: number
	): void {
		if (!evidence?.visible) {
			runtime.notice = Math.max(0, runtime.notice - dt * 0.42);
			return;
		}
		const noticeSeconds =
			runtime.disposition === 'off-guard'
				? this.profile.offGuardNoticeSeconds
				: runtime.disposition === 'routine'
					? this.profile.routineNoticeSeconds
					: this.profile.alertNoticeSeconds;
		const evidenceWeight = 0.25 + Math.min(1, Math.max(0, evidence.confidence)) * 0.75;
		runtime.notice = Math.min(
			1,
			runtime.notice + (dt / Math.max(0.05, noticeSeconds)) * evidenceWeight
		);
		if (runtime.notice >= 1) runtime.state = 'engaged';
	}

	isEngaged(enemy: CombatEntity): boolean {
		return enemy.awarenessState === 'engaged' || Boolean(enemy.isDummy);
	}

	engage(enemy: CombatEntity): void {
		const runtime = this.ensureRuntime(enemy, 0);
		runtime.state = 'engaged';
		runtime.notice = 1;
		enemy.awarenessState = 'engaged';
		enemy.awarenessLevel = 1;
	}

	raiseNotice(enemy: CombatEntity, amount: number): void {
		if (!Number.isFinite(amount) || amount <= 0) return;
		const runtime = this.ensureRuntime(enemy, 0);
		if (runtime.state === 'engaged') return;
		runtime.notice = Math.min(1, runtime.notice + amount);
		if (runtime.notice >= 1) runtime.state = 'engaged';
		enemy.awarenessState = runtime.state;
		enemy.awarenessLevel = runtime.state === 'engaged' ? 1 : runtime.notice;
	}

	private stepNotice(
		runtime: EnemyReadinessRuntime,
		enemy: CombatEntity,
		player: Player,
		dt: number
	): void {
		const enemyCenterX = enemy.x + enemy.w / 2;
		const enemyCenterY = enemy.y + enemy.h / 2;
		const playerCenterX = player.x + player.w / 2;
		const playerCenterY = player.y + player.h / 2;
		const dx = playerCenterX - enemyCenterX;
		const dy = Math.abs(playerCenterY - enemyCenterY);
		const facingPlayer = dx === 0 || Math.sign(dx) === (enemy.dir || runtime.direction);
		const range = facingPlayer ? this.profile.frontDetectionRange : this.profile.rearDetectionRange;
		const visible = Math.abs(dx) <= range && dy <= this.profile.verticalDetectionRange;
		if (!visible) {
			runtime.notice = Math.max(0, runtime.notice - dt * 0.42);
			return;
		}
		const noticeSeconds =
			runtime.disposition === 'off-guard'
				? this.profile.offGuardNoticeSeconds
				: runtime.disposition === 'routine'
					? this.profile.routineNoticeSeconds
					: this.profile.alertNoticeSeconds;
		runtime.notice = Math.min(1, runtime.notice + dt / Math.max(0.05, noticeSeconds));
		if (runtime.notice >= 1) runtime.state = 'engaged';
	}

	private stepCalmBehavior(
		runtime: EnemyReadinessRuntime,
		enemy: CombatEntity,
		dt: number
	): void {
		if (runtime.disposition === 'off-guard' || runtime.disposition === 'alert') {
			enemy.vx = 0;
			enemy.aiState = runtime.disposition;
			enemy.spriteAnimation = 'idle';
			return;
		}
		if (enemy.x <= runtime.spawnX - this.profile.routinePatrolRadius) runtime.direction = 1;
		if (enemy.x >= runtime.spawnX + this.profile.routinePatrolRadius) runtime.direction = -1;
		enemy.dir = runtime.direction;
		enemy.vx = runtime.direction * this.profile.routinePatrolSpeed;
		enemy.x += enemy.vx * dt;
		enemy.aiState = 'routine';
		enemy.spriteAnimation = 'patrol_or_move';
	}

	private ensureRuntime(enemy: CombatEntity, index: number): EnemyReadinessRuntime {
		const id = stableEnemyId(enemy, index);
		const existing = this.runtime.get(id);
		if (existing) return existing;
		const disposition = inferDisposition(enemy);
		const created: EnemyReadinessRuntime = {
			disposition,
			state: disposition,
			notice: 0,
			spawnX: enemy.x,
			direction: enemy.dir < 0 ? -1 : 1,
		};
		this.runtime.set(id, created);
		return created;
	}
}

export function inferDisposition(enemy: CombatEntity): EnemyDisposition {
	if (enemy.bossId) return 'alert';
	const role = enemy.procgenRole ?? '';
	if (['turret', 'ranged', 'trapper', 'summoner'].includes(role)) return 'alert';
	if (['patrol', 'skirmisher', 'swarm'].includes(role)) return 'routine';
	return 'off-guard';
}
