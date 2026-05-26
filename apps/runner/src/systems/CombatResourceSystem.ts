export type CombatResourceKind = 'stamina' | 'heat' | 'focus' | 'ammo';

export interface CombatResourcePool {
	kind: CombatResourceKind;
	value: number;
	max: number;
	regenPerSecond: number;
	decayPerSecond?: number;
}

export interface CombatResourceState {
	ownerId: string;
	pools: CombatResourcePool[];
}

export interface ResourceCost {
	kind: CombatResourceKind;
	amount: number;
}

export interface ResourceEvent {
	kind: 'spent' | 'blocked' | 'regenerated' | 'decayed';
	ownerId: string;
	resource: CombatResourceKind;
	amount: number;
}

function clonePool(pool: CombatResourcePool): CombatResourcePool {
	return { ...pool };
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function stepCombatResources(state: CombatResourceState, dt: number): { state: CombatResourceState; events: ResourceEvent[] } {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid resource dt: ${dt}`);
	const events: ResourceEvent[] = [];
	const pools = state.pools.map((pool) => {
		const next = clonePool(pool);
		if (pool.regenPerSecond > 0 && pool.value < pool.max) {
			const before = next.value;
			next.value = clamp(next.value + pool.regenPerSecond * dt, 0, next.max);
			if (next.value !== before) events.push({ kind: 'regenerated', ownerId: state.ownerId, resource: pool.kind, amount: Number((next.value - before).toFixed(6)) });
		}
		if ((pool.decayPerSecond ?? 0) > 0 && next.value > 0) {
			const before = next.value;
			next.value = clamp(next.value - (pool.decayPerSecond ?? 0) * dt, 0, next.max);
			if (next.value !== before) events.push({ kind: 'decayed', ownerId: state.ownerId, resource: pool.kind, amount: Number((before - next.value).toFixed(6)) });
		}
		return next;
	});
	return { state: { ownerId: state.ownerId, pools }, events };
}

export function canPayResourceCosts(state: CombatResourceState, costs: readonly ResourceCost[]): boolean {
	return costs.every((cost) => (state.pools.find((pool) => pool.kind === cost.kind)?.value ?? 0) >= cost.amount);
}

export function payResourceCosts(state: CombatResourceState, costs: readonly ResourceCost[]): { state: CombatResourceState; events: ResourceEvent[]; ok: boolean } {
	if (!canPayResourceCosts(state, costs)) {
		const blocked = costs.find((cost) => (state.pools.find((pool) => pool.kind === cost.kind)?.value ?? 0) < cost.amount);
		return {
			state: { ownerId: state.ownerId, pools: state.pools.map(clonePool) },
			events: blocked ? [{ kind: 'blocked', ownerId: state.ownerId, resource: blocked.kind, amount: blocked.amount }] : [],
			ok: false,
		};
	}

	const events: ResourceEvent[] = [];
	const pools = state.pools.map((pool) => {
		const totalCost = costs.filter((cost) => cost.kind === pool.kind).reduce((sum, cost) => sum + cost.amount, 0);
		if (totalCost === 0) return clonePool(pool);
		events.push({ kind: 'spent', ownerId: state.ownerId, resource: pool.kind, amount: totalCost });
		return { ...pool, value: Number((pool.value - totalCost).toFixed(6)) };
	});
	return { state: { ownerId: state.ownerId, pools }, events, ok: true };
}
