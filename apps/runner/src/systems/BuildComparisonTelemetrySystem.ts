import type { ResolutionApproach } from '../game/ResolutionApproach';
import type { CivilianWitnessEvent } from './CivilianWitnessSystem';
import type { CombatEvent } from './CombatSystem';
import type { EnemyAlarmDeviceEvent } from './EnemyAlarmDeviceSystem';
import type {
	ExpeditionPressureEvent,
	ExpeditionPressureSnapshot,
} from './ExpeditionPressureSystem';

export interface BuildTelemetrySnapshot {
	runId: string;
	stageId: string;
	durationSeconds: number;
	loadoutItemIds: string[];
	skillRanks: Record<string, number>;
	approaches: ResolutionApproach[];
	damageDealt: number;
	damageTaken: number;
	kills: number;
	alarmsTriggered: number;
	alarmsSpoofed: number;
	alarmsDisabled: number;
	civiliansDocumenting: number;
	civiliansEvacuated: number;
	civiliansSheltered: number;
	standDownAppeals: number;
	salvageBanked: number;
	salvageLost: number;
	deaths: number;
	replayTimeline?: BuildReplayTimelineEvent[];
}

function sanitizeReplayTimeline(value: unknown): BuildReplayTimelineEvent[] {
	if (!Array.isArray(value)) return [];
	const result: BuildReplayTimelineEvent[] = [];
	for (const candidate of value.slice(0, 512)) {
		if (!isRecord(candidate) || !isReplayEventKind(candidate.kind)) continue;
		const detail = isRecord(candidate.detail)
			? Object.fromEntries(
					Object.entries(candidate.detail).filter(
						(entry): entry is [string, string | number | boolean] =>
							typeof entry[1] === 'string' ||
							typeof entry[1] === 'boolean' ||
							(typeof entry[1] === 'number' && Number.isFinite(entry[1]))
					)
				)
			: {};
		result.push({
			sequence: result.length,
			atSeconds: nonNegativeNumber(candidate.atSeconds),
			kind: candidate.kind,
			detail,
		});
	}
	return result;
}

const BUILD_REPLAY_EVENT_KINDS = new Set<BuildReplayEventKind>([
	'run-start',
	'combat-hit',
	'combat-damage',
	'combat-kill',
	'alarm-triggered',
	'alarm-spoofed',
	'alarm-disabled',
	'civilian-documented',
	'civilian-evacuating',
	'civilian-sheltered',
	'stand-down-appeal',
	'salvage-collected',
	'salvage-banked',
	'salvage-lost',
	'checkpoint-reset',
	'expedition-settled',
	'build-locked',
]);

function isReplayEventKind(value: unknown): value is BuildReplayEventKind {
	return typeof value === 'string' && BUILD_REPLAY_EVENT_KINDS.has(value as BuildReplayEventKind);
}

export type BuildReplayEventKind =
	| 'run-start'
	| 'combat-hit'
	| 'combat-damage'
	| 'combat-kill'
	| 'alarm-triggered'
	| 'alarm-spoofed'
	| 'alarm-disabled'
	| 'civilian-documented'
	| 'civilian-evacuating'
	| 'civilian-sheltered'
	| 'stand-down-appeal'
	| 'salvage-collected'
	| 'salvage-banked'
	| 'salvage-lost'
	| 'checkpoint-reset'
	| 'expedition-settled'
	| 'build-locked';

export interface BuildReplayTimelineEvent {
	sequence: number;
	atSeconds: number;
	kind: BuildReplayEventKind;
	detail: Record<string, string | number | boolean>;
}

export function sanitizeBuildTelemetryHistory(
	value: unknown,
	limit = BUILD_TELEMETRY_HISTORY_LIMIT
): BuildTelemetrySnapshot[] {
	if (!Array.isArray(value)) return [];
	const byRunId = new Map<string, BuildTelemetrySnapshot>();
	for (const candidate of value) {
		const snapshot = sanitizeBuildTelemetrySnapshot(candidate);
		if (snapshot) byRunId.set(snapshot.runId, snapshot);
	}
	return [...byRunId.values()].slice(-Math.max(1, Math.floor(limit)));
}

export function sanitizeBuildTelemetrySnapshot(value: unknown): BuildTelemetrySnapshot | null {
	if (!isRecord(value) || !validId(value.runId) || !validId(value.stageId)) return null;
	const approaches = Array.isArray(value.approaches)
		? value.approaches.filter(isResolutionApproach)
		: [];
	const replayTimeline = sanitizeReplayTimeline(value.replayTimeline);
	return {
		runId: value.runId,
		stageId: value.stageId,
		durationSeconds: nonNegativeNumber(value.durationSeconds),
		loadoutItemIds: stringArray(value.loadoutItemIds),
		skillRanks: positiveNumberRecord(value.skillRanks),
		approaches: [...new Set(approaches)],
		damageDealt: nonNegativeNumber(value.damageDealt),
		damageTaken: nonNegativeNumber(value.damageTaken),
		kills: nonNegativeInteger(value.kills),
		alarmsTriggered: nonNegativeInteger(value.alarmsTriggered),
		alarmsSpoofed: nonNegativeInteger(value.alarmsSpoofed),
		alarmsDisabled: nonNegativeInteger(value.alarmsDisabled),
		civiliansDocumenting: nonNegativeInteger(value.civiliansDocumenting),
		civiliansEvacuated: nonNegativeInteger(value.civiliansEvacuated),
		civiliansSheltered: nonNegativeInteger(value.civiliansSheltered),
		standDownAppeals: nonNegativeInteger(value.standDownAppeals),
		salvageBanked: nonNegativeInteger(value.salvageBanked),
		salvageLost: nonNegativeInteger(value.salvageLost),
		deaths: nonNegativeInteger(value.deaths),
		...(replayTimeline.length > 0 ? { replayTimeline } : {}),
	};
}

export const BUILD_TELEMETRY_HISTORY_LIMIT = 12;

export interface BuildTelemetryComparison {
	leftRunId: string;
	rightRunId: string;
	deltas: {
		durationSeconds: number;
		damageDealt: number;
		damageTaken: number;
		kills: number;
		alarmsTriggered: number;
		civiliansEvacuated: number;
		standDownAppeals: number;
		salvageBanked: number;
		salvageLost: number;
		deaths: number;
	};
	interpretation: string[];
}

/**
 * Observational run telemetry for balance review.
 *
 * This system has no references to combat, reward, AI, persistence, or tuning
 * mutators. It can explain a run; it cannot make a run easier or harder.
 */
export class BuildComparisonTelemetrySystem {
	private durationSeconds = 0;
	private damageDealt = 0;
	private damageTaken = 0;
	private kills = 0;
	private alarmsTriggered = 0;
	private alarmsSpoofed = 0;
	private alarmsDisabled = 0;
	private civiliansDocumenting = 0;
	private civiliansEvacuated = 0;
	private civiliansSheltered = 0;
	private standDownAppeals = 0;
	private pressure: ExpeditionPressureSnapshot = {
		unbankedSalvage: 0,
		bankedSalvage: 0,
		lostSalvage: 0,
		deaths: 0,
		collectedSourceIds: [],
	};
	private loadoutItemIds: string[] = [];
	private skillRanks: Record<string, number> = {};
	private approaches: ResolutionApproach[] = [];
	private readonly replayTimeline: BuildReplayTimelineEvent[] = [
		{ sequence: 0, atSeconds: 0, kind: 'run-start', detail: {} },
	];

	constructor(
		private readonly runId: string,
		private readonly stageId: string
	) {}

	step(dt: number): void {
		this.durationSeconds += Math.max(0, Number.isFinite(dt) ? dt : 0);
	}

	recordCombat(event: CombatEvent): void {
		if (event.kind === 'hit' && event.source === 'player') {
			this.damageDealt += Math.max(0, event.damage ?? 0);
			this.recordTimeline('combat-hit', {
				damage: Math.max(0, event.damage ?? 0),
				targetId: event.targetId ?? 'unknown',
			});
		}
		if (event.kind === 'damage' && event.source === 'enemy') {
			this.damageTaken += Math.max(0, event.damage ?? 0);
			this.recordTimeline('combat-damage', {
				damage: Math.max(0, event.damage ?? 0),
				targetId: event.targetId ?? 'player',
			});
		}
		if (event.kind === 'kill' && event.source === 'player') {
			this.kills += 1;
			this.recordTimeline('combat-kill', { targetId: event.targetId ?? 'unknown' });
		}
	}

	recordAlarm(event: EnemyAlarmDeviceEvent): void {
		if (event.kind === 'alarm-triggered') {
			this.alarmsTriggered += 1;
			this.recordTimeline('alarm-triggered', { deviceId: event.deviceId });
		}
		if (event.kind === 'alarm-spoofed') {
			this.alarmsSpoofed += 1;
			this.recordTimeline('alarm-spoofed', { deviceId: event.deviceId });
		}
		if (event.kind === 'alarm-disabled') {
			this.alarmsDisabled += 1;
			this.recordTimeline('alarm-disabled', { deviceId: event.deviceId });
		}
	}

	recordCivilian(event: CivilianWitnessEvent): void {
		if (event.kind === 'civilian-documented') {
			this.civiliansDocumenting += 1;
			this.recordTimeline('civilian-documented', { witnessId: event.witnessId });
		}
		if (event.kind === 'civilian-evacuating') {
			this.civiliansEvacuated += 1;
			this.recordTimeline('civilian-evacuating', { witnessId: event.witnessId });
		}
		if (event.kind === 'civilian-sheltered') {
			this.civiliansSheltered += 1;
			this.recordTimeline('civilian-sheltered', { witnessId: event.witnessId });
		}
		if (event.kind === 'civilian-stand-down-appeal') {
			this.standDownAppeals += 1;
			this.recordTimeline('stand-down-appeal', {
				witnessId: event.witnessId,
				cellId: event.cellId,
				legitimacy: event.legitimacy,
			});
		}
	}

	recordPressure(_event: ExpeditionPressureEvent, snapshot: ExpeditionPressureSnapshot): void {
		this.pressure = {
			...snapshot,
			collectedSourceIds: [...snapshot.collectedSourceIds],
		};
		const event = _event;
		if (event.kind === 'salvage-collected') {
			this.recordTimeline('salvage-collected', {
				sourceId: event.sourceId,
				amount: event.amount,
			});
		} else if (event.kind === 'salvage-banked') {
			this.recordTimeline('salvage-banked', {
				checkpointId: event.checkpointId,
				amount: event.amount,
			});
		} else if (event.kind === 'salvage-lost') {
			this.recordTimeline('salvage-lost', {
				checkpointId: event.checkpointId,
				amount: event.amount,
			});
		} else if (event.kind === 'pressure-reset-applied') {
			this.recordTimeline('checkpoint-reset', {
				checkpointId: event.checkpointId,
				policyId: event.policy.id,
			});
		} else if (event.kind === 'expedition-settled') {
			this.recordTimeline('expedition-settled', { amount: event.amount });
		}
	}

	setBuild(
		loadoutItemIds: readonly string[],
		skillRanks: Readonly<Record<string, number>>,
		approaches: readonly ResolutionApproach[]
	): void {
		this.loadoutItemIds = [...new Set(loadoutItemIds)].sort();
		const rankedSkills = Object.entries(skillRanks)
			.filter((entry): entry is [string, number] => Number.isFinite(entry[1]) && entry[1] > 0)
			.map(([skillId, rank]): [string, number] => [skillId, Math.floor(rank)])
			.sort(([left], [right]) => left.localeCompare(right));
		this.skillRanks = Object.fromEntries(rankedSkills);
		this.approaches = [...new Set(approaches)].sort();
		this.recordTimeline('build-locked', {
			loadoutCount: this.loadoutItemIds.length,
			skillCount: Object.keys(this.skillRanks).length,
			approachCount: this.approaches.length,
		});
	}

	getSnapshot(): BuildTelemetrySnapshot {
		const replayTimeline = this.getReplayTimeline();
		return {
			runId: this.runId,
			stageId: this.stageId,
			durationSeconds: round(this.durationSeconds),
			loadoutItemIds: [...this.loadoutItemIds],
			skillRanks: { ...this.skillRanks },
			approaches: [...this.approaches],
			damageDealt: round(this.damageDealt),
			damageTaken: round(this.damageTaken),
			kills: this.kills,
			alarmsTriggered: this.alarmsTriggered,
			alarmsSpoofed: this.alarmsSpoofed,
			alarmsDisabled: this.alarmsDisabled,
			civiliansDocumenting: this.civiliansDocumenting,
			civiliansEvacuated: this.civiliansEvacuated,
			civiliansSheltered: this.civiliansSheltered,
			standDownAppeals: this.standDownAppeals,
			salvageBanked: this.pressure.bankedSalvage,
			salvageLost: this.pressure.lostSalvage,
			deaths: this.pressure.deaths,
			...(replayTimeline.length > 1 ? { replayTimeline } : {}),
		};
	}

	getReplayTimeline(): BuildReplayTimelineEvent[] {
		return this.replayTimeline.map((event) => ({
			...event,
			detail: { ...event.detail },
		}));
	}

	private recordTimeline(
		kind: BuildReplayEventKind,
		detail: Record<string, string | number | boolean>
	): void {
		this.replayTimeline.push({
			sequence: this.replayTimeline.length,
			atSeconds: round(this.durationSeconds),
			kind,
			detail: { ...detail },
		});
	}
}

export function compareBuildTelemetry(
	left: BuildTelemetrySnapshot,
	right: BuildTelemetrySnapshot
): BuildTelemetryComparison {
	const deltas = {
		durationSeconds: round(right.durationSeconds - left.durationSeconds),
		damageDealt: round(right.damageDealt - left.damageDealt),
		damageTaken: round(right.damageTaken - left.damageTaken),
		kills: right.kills - left.kills,
		alarmsTriggered: right.alarmsTriggered - left.alarmsTriggered,
		civiliansEvacuated: right.civiliansEvacuated - left.civiliansEvacuated,
		standDownAppeals: right.standDownAppeals - left.standDownAppeals,
		salvageBanked: right.salvageBanked - left.salvageBanked,
		salvageLost: right.salvageLost - left.salvageLost,
		deaths: right.deaths - left.deaths,
	};
	const interpretation: string[] = [];
	if (deltas.durationSeconds < -10)
		interpretation.push('Right build completed the space materially faster.');
	if (deltas.damageTaken < -2)
		interpretation.push('Right build reduced incoming damage materially.');
	if (deltas.alarmsTriggered < 0)
		interpretation.push('Right build produced fewer confirmed alarm reports.');
	if (deltas.standDownAppeals > 0)
		interpretation.push('Right build created more nonlethal stand-down opportunities.');
	if (deltas.salvageLost < 0)
		interpretation.push('Right build exposed less field salvage to death loss.');
	if (interpretation.length === 0)
		interpretation.push('No material difference crossed the review thresholds.');
	return { leftRunId: left.runId, rightRunId: right.runId, deltas, interpretation };
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

const RESOLUTION_APPROACHES = new Set<ResolutionApproach>([
	'claw',
	'ballistics',
	'ghoststep',
	'hacking',
	'repair',
	'social',
	'exploration',
]);

function isResolutionApproach(value: unknown): value is ResolutionApproach {
	return typeof value === 'string' && RESOLUTION_APPROACHES.has(value as ResolutionApproach);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function validId(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0 && value.length <= 160;
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? [...new Set(value.filter((entry): entry is string => validId(entry)))].sort()
		: [];
}

function positiveNumberRecord(value: unknown): Record<string, number> {
	if (!isRecord(value)) return {};
	const ranks = Object.entries(value)
		.filter(
			(entry): entry is [string, number] =>
				validId(entry[0]) &&
				typeof entry[1] === 'number' &&
				Number.isFinite(entry[1]) &&
				entry[1] > 0
		)
		.map(([key, rank]): [string, number] => [key, Math.floor(rank)])
		.sort(([left], [right]) => left.localeCompare(right));
	return Object.fromEntries(ranks);
}

function nonNegativeNumber(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, round(value)) : 0;
}

function nonNegativeInteger(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
