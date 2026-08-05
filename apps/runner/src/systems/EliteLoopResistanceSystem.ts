import type { CombatEntity } from './CombatSystem';

export interface EliteLoopResistanceResult {
	eligible: boolean;
	moveKey: string;
	repeatCount: number;
	stunScale: number;
	poiseScale: number;
	stun: number;
	poiseDamage: number;
	resisted: boolean;
}

const LOOP_WINDOW_SECONDS = 1.4;
const STUN_SCALES = [1, 0.72, 0.48, 0.28] as const;
const POISE_SCALES = [1, 0.85, 0.65, 0.5] as const;

/**
 * Deterministic repetition resistance for authored elites and bosses.
 *
 * It never changes damage, reads input, or observes player success. It only
 * scales control duration when the same move family repeatedly reaches the
 * same elite within a bounded interval. A different move or a pause resets it.
 */
export function resolveEliteLoopResistance(
	target: CombatEntity,
	moveKey: string,
	time: number,
	stun: number,
	poiseDamage: number
): EliteLoopResistanceResult {
	const eligible = isEliteLoopTarget(target);
	if (!eligible) {
		return {
			eligible: false,
			moveKey,
			repeatCount: 1,
			stunScale: 1,
			poiseScale: 1,
			stun,
			poiseDamage,
			resisted: false,
		};
	}
	const safeTime = Number.isFinite(time) ? time : 0;
	const repeated =
		target.loopResistanceMoveId === moveKey &&
		Number.isFinite(target.loopResistanceLastHitTime) &&
		safeTime - (target.loopResistanceLastHitTime ?? 0) <= LOOP_WINDOW_SECONDS &&
		safeTime >= (target.loopResistanceLastHitTime ?? 0);
	const repeatCount = repeated ? Math.min(99, (target.loopResistanceRepeatCount ?? 1) + 1) : 1;
	const scaleIndex = Math.min(repeatCount - 1, STUN_SCALES.length - 1);
	const stunScale = STUN_SCALES[scaleIndex] ?? 1;
	const poiseScale = POISE_SCALES[scaleIndex] ?? 1;
	target.loopResistanceMoveId = moveKey;
	target.loopResistanceRepeatCount = repeatCount;
	target.loopResistanceLastHitTime = safeTime;
	target.loopResistanceUntil = safeTime + LOOP_WINDOW_SECONDS;
	return {
		eligible: true,
		moveKey,
		repeatCount,
		stunScale,
		poiseScale,
		stun: Math.max(0, stun * stunScale),
		poiseDamage: Math.max(0, poiseDamage * poiseScale),
		resisted: repeatCount > 1,
	};
}

export function isEliteLoopTarget(target: CombatEntity): boolean {
	return (
		target.combatRank === 'elite' ||
		target.combatRank === 'boss' ||
		Boolean(target.bossId) ||
		(target.procgenAffixes ?? []).includes('elite')
	);
}

export function resetEliteLoopResistance(target: CombatEntity): void {
	target.loopResistanceMoveId = undefined;
	target.loopResistanceRepeatCount = 0;
	target.loopResistanceLastHitTime = undefined;
	target.loopResistanceUntil = undefined;
}
