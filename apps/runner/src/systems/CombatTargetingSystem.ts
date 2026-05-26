import type { CombatEntity } from './CombatSystem';

export interface TargetingWeights {
	distance: number;
	lowHp: number;
	threat: number;
	lineOfSight: number;
}

export interface TargetingContext {
	origin: Pick<CombatEntity, 'id' | 'x' | 'y' | 'w' | 'h' | 'faction'>;
	candidates: readonly CombatEntity[];
	maxDistance?: number;
	lineOfSightIds?: readonly string[];
	threatById?: Record<string, number>;
	weights?: Partial<TargetingWeights>;
}

export interface TargetScore {
	id: string;
	score: number;
	distance: number;
	reasons: Record<string, number>;
}

const DEFAULT_WEIGHTS: TargetingWeights = {
	distance: 1,
	lowHp: 0.35,
	threat: 0.5,
	lineOfSight: 0.25,
};

function center(entity: Pick<CombatEntity, 'x' | 'y' | 'w' | 'h'>): { x: number; y: number } {
	return { x: entity.x + entity.w / 2, y: entity.y + entity.h / 2 };
}

function distance(a: Pick<CombatEntity, 'x' | 'y' | 'w' | 'h'>, b: Pick<CombatEntity, 'x' | 'y' | 'w' | 'h'>): number {
	const ca = center(a);
	const cb = center(b);
	return Math.hypot(ca.x - cb.x, ca.y - cb.y);
}

export function scoreTargets(context: TargetingContext): TargetScore[] {
	const weights = { ...DEFAULT_WEIGHTS, ...(context.weights ?? {}) };
	const lineOfSight = new Set(context.lineOfSightIds ?? []);
	return context.candidates
		.filter((candidate) => candidate.id && candidate.id !== context.origin.id && candidate.hp > 0)
		.filter((candidate) => !context.origin.faction || !candidate.faction || candidate.faction !== context.origin.faction)
		.map((candidate) => {
			const d = distance(context.origin, candidate);
			if (context.maxDistance !== undefined && d > context.maxDistance) return null;
			const distanceScore = weights.distance / Math.max(1, d);
			const lowHpScore = weights.lowHp * (1 - Math.max(0, candidate.hp) / Math.max(1, candidate.maxHp));
			const threatScore = weights.threat * (context.threatById?.[candidate.id ?? ''] ?? 0);
			const losScore = weights.lineOfSight * (lineOfSight.has(candidate.id ?? '') ? 1 : 0);
			return {
				id: candidate.id ?? 'unknown',
				score: distanceScore + lowHpScore + threatScore + losScore,
				distance: d,
				reasons: { distance: distanceScore, lowHp: lowHpScore, threat: threatScore, lineOfSight: losScore },
			};
		})
		.filter((score): score is TargetScore => score !== null)
		.sort((a, b) => b.score - a.score || a.distance - b.distance || a.id.localeCompare(b.id));
}

export function chooseTarget(context: TargetingContext): TargetScore | null {
	return scoreTargets(context)[0] ?? null;
}
