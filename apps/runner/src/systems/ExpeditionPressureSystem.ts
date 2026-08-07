import type { StageCheckpointResetPolicy } from './StageCheckpointSystem';

export interface ExpeditionPressureSnapshot {
	unbankedSalvage: number;
	bankedSalvage: number;
	lostSalvage: number;
	deaths: number;
	activeCheckpointId?: string;
	collectedSourceIds: string[];
	lastResetPolicyId?: StageCheckpointResetPolicy['id'];
}

function nonNegativeInteger(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.max(0, Math.floor(value))
		: 0;
}

function nonEmptyString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export interface ExpeditionPressureSeed {
	unbankedSalvage?: number;
	bankedSalvage?: number;
	lostSalvage?: number;
	deaths?: number;
	activeCheckpointId?: string;
	collectedSourceIds?: readonly string[];
}

export type ExpeditionPressureEvent =
	| {
			kind: 'salvage-collected';
			sourceId: string;
			amount: number;
			unbankedSalvage: number;
		}
	| {
			kind: 'salvage-banked';
			checkpointId: string;
			amount: number;
			bankedSalvage: number;
		}
	| {
			kind: 'salvage-lost';
			checkpointId: string;
			amount: number;
			remainingUnbanked: number;
			policyId: StageCheckpointResetPolicy['id'];
		}
	| {
			kind: 'pressure-reset-applied';
			checkpointId: string;
			policy: StageCheckpointResetPolicy;
		}
	| {
			kind: 'expedition-settled';
			amount: number;
			bankedSalvage: number;
		};

/**
 * Runtime-only expedition pressure.
 *
 * Field salvage is intentionally not persistent currency. It is deduplicated
 * by authored source, banked at checkpoints, partially exposed to death loss,
 * and settled exactly once through the expedition commit boundary.
 */
export class ExpeditionPressureSystem {
	private unbankedSalvage = 0;
	private bankedSalvage = 0;
	private lostSalvage = 0;
	private deaths = 0;
	private activeCheckpointId?: string;
	private lastResetPolicyId?: StageCheckpointResetPolicy['id'];
	private readonly collectedSourceIds = new Set<string>();
	private settled = false;

	constructor(seed: ExpeditionPressureSeed = {}) {
		this.unbankedSalvage = nonNegativeInteger(seed.unbankedSalvage);
		this.bankedSalvage = nonNegativeInteger(seed.bankedSalvage);
		this.lostSalvage = nonNegativeInteger(seed.lostSalvage);
		this.deaths = nonNegativeInteger(seed.deaths);
		this.activeCheckpointId = nonEmptyString(seed.activeCheckpointId);
		for (const sourceId of seed.collectedSourceIds ?? []) {
			if (typeof sourceId === 'string' && sourceId.length > 0) this.collectedSourceIds.add(sourceId);
		}
	}

	collect(sourceId: string, amount: number): ExpeditionPressureEvent[] {
		if (
			this.settled ||
			typeof sourceId !== 'string' ||
			sourceId.length === 0 ||
			!Number.isFinite(amount) ||
			amount <= 0 ||
			this.collectedSourceIds.has(sourceId)
		) {
			return [];
		}
		const normalized = Math.max(1, Math.floor(amount));
		this.collectedSourceIds.add(sourceId);
		this.unbankedSalvage += normalized;
		return [
			{
				kind: 'salvage-collected',
				sourceId,
				amount: normalized,
				unbankedSalvage: this.unbankedSalvage,
			},
		];
	}

	activateCheckpoint(checkpointId: string): ExpeditionPressureEvent[] {
		if (this.settled || checkpointId.length === 0) return [];
		this.activeCheckpointId = checkpointId;
		if (this.unbankedSalvage <= 0) return [];
		const amount = this.unbankedSalvage;
		this.unbankedSalvage = 0;
		this.bankedSalvage += amount;
		return [
			{
				kind: 'salvage-banked',
				checkpointId,
				amount,
				bankedSalvage: this.bankedSalvage,
			},
		];
	}

	respawn(
		checkpointId: string,
		policy: StageCheckpointResetPolicy
	): ExpeditionPressureEvent[] {
		if (this.settled) return [];
		this.deaths += 1;
		this.activeCheckpointId = checkpointId;
		this.lastResetPolicyId = policy.id;
		const lossRate = Math.min(1, Math.max(0, policy.unbankedSalvageLossRate));
		const lost = Math.min(
			this.unbankedSalvage,
			Math.max(0, Math.floor(this.unbankedSalvage * lossRate))
		);
		this.unbankedSalvage -= lost;
		this.lostSalvage += lost;
		const events: ExpeditionPressureEvent[] = [];
		if (lost > 0) {
			events.push({
				kind: 'salvage-lost',
				checkpointId,
				amount: lost,
				remainingUnbanked: this.unbankedSalvage,
				policyId: policy.id,
			});
		}
		events.push({
			kind: 'pressure-reset-applied',
			checkpointId,
			policy: { ...policy },
		});
		return events;
	}

	settleExpedition(): ExpeditionPressureEvent[] {
		if (this.settled) return [];
		this.settled = true;
		const amount = this.unbankedSalvage;
		this.unbankedSalvage = 0;
		this.bankedSalvage += amount;
		return [
			{
				kind: 'expedition-settled',
				amount,
				bankedSalvage: this.bankedSalvage,
			},
		];
	}

	getSnapshot(): ExpeditionPressureSnapshot {
		return {
			unbankedSalvage: this.unbankedSalvage,
			bankedSalvage: this.bankedSalvage,
			lostSalvage: this.lostSalvage,
			deaths: this.deaths,
			activeCheckpointId: this.activeCheckpointId,
			collectedSourceIds: [...this.collectedSourceIds].sort(),
			lastResetPolicyId: this.lastResetPolicyId,
		};
	}
}
