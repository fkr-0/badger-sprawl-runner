import type { StoryProgress } from '../GameFlow';
import type { AdventureSaveV2 } from './AdventureState';
import { LATE_ACT_SCHEDULE_RULES } from './LateActScheduleContent';
import { ALGORITHMIC_CIVIC_SCHEDULE_RULES } from './AlgorithmicCivicContent';

export type WorldBeat =
	| 'city-night'
	| 'floodline-open'
	| 'vertical-shift'
	| 'skybound'
	| 'colony-watch'
	| 'public-forecast'
	| 'homecoming'
	| 'last-route'
	| 'commons-dawn';

export interface NpcScheduleRule {
	npcId: string;
	locationId: string;
	fromBeat: WorldBeat;
	untilBeatExclusive?: WorldBeat;
	priority: number;
	requiresWorldFlags?: string[];
	forbidsWorldFlags?: string[];
}

export interface WorldScheduleSnapshot {
	beat: WorldBeat;
	label: string;
	notice: string;
	scheduledLocationByNpcId: Record<string, string>;
}

const BEAT_ORDER: readonly WorldBeat[] = [
	'city-night',
	'floodline-open',
	'vertical-shift',
	'skybound',
	'colony-watch',
	'public-forecast',
	'homecoming',
	'last-route',
	'commons-dawn',
];

const BEAT_COPY: Record<WorldBeat, { label: string; notice: string }> = {
	'city-night': {
		label: 'CITY NIGHT // THE MAP PRETENDS TO SLEEP',
		notice: 'Most movement remains unofficial, local, and deniable.',
	},
	'floodline-open': {
		label: 'FLOODLINE SHIFT // CARE ENTERS THE TIMETABLE',
		notice: 'Clinic stock and passengers now compete openly with profitable freight.',
	},
	'vertical-shift': {
		label: 'VERTICAL SHIFT // THE SUBWAY FINDS THE MISSING FLOORS',
		notice: 'Blue Mercy reaches the Arcology basement; freight lifts continue denying they are public transit.',
	},
	'skybound': {
		label: 'SKYBOUND // THE ELEVATOR SEED BENDS THE MAP',
		notice: 'Worker routes, prison cargo, and premium ascent now share one disputed routing instrument.',
	},
	'colony-watch': {
		label: 'COLONY WATCH // THE LINE LEARNS ANOTHER HOME',
		notice: 'City crews exchange medicine, tools, air practice, and arguments with Chorus Rail.',
	},
	'public-forecast': {
		label: 'PUBLIC FORECAST // ARRIVAL HAS ASSUMPTIONS',
		notice: 'Schedules publish confidence, method, calibration, and objections beside the time.',
	},
	'homecoming': {
		label: 'HOMECOMING // DOWNBOUND CARGO DECLARES ITSELF PASSENGERS',
		notice: 'Seeds, freed workers, tools, testimony, and unresolved colony politics descend toward Blue Mercy.',
	},
	'last-route': {
		label: 'LAST ROUTE // BLUE MERCY LAUNCHES A MESSAGE THAT CAN ANSWER BACK',
		notice: 'City, colony, and asteroid maintain one final expedition without appointing a permanent center.',
	},
	'commons-dawn': {
		label: 'COMMONS DAWN // NO STATION IS THE CENTER',
		notice: 'The network rotates crews, revises maps, and keeps a route open for disagreement.',
	},
};

export const NPC_SCHEDULE_RULES: readonly NpcScheduleRule[] = [
	{
		npcId: 'silk-suture',
		locationId: 'drainmarket:station',
		fromBeat: 'floodline-open',
		priority: 20,
	},
	{
		npcId: 'lio-vale',
		locationId: 'chrome-arcology:settlement',
		fromBeat: 'vertical-shift',
		untilBeatExclusive: 'skybound',
		priority: 30,
	},
	{
		npcId: 'rook-null',
		locationId: 'chrome-arcology:safehouse',
		fromBeat: 'vertical-shift',
		untilBeatExclusive: 'skybound',
		priority: 30,
	},
	{
		npcId: 'lio-vale',
		locationId: 'mirror-palace:safehouse',
		fromBeat: 'skybound',
		untilBeatExclusive: 'homecoming',
		priority: 40,
	},
	{
		npcId: 'rook-null',
		locationId: 'chrome-arcology:station',
		fromBeat: 'skybound',
		untilBeatExclusive: 'homecoming',
		priority: 40,
	},
	{
		npcId: 'sable-meridian',
		locationId: 'mirror-palace:safehouse',
		fromBeat: 'skybound',
		untilBeatExclusive: 'homecoming',
		priority: 42,
	},
	{
		npcId: 'orchid-debt',
		locationId: 'mirror-palace:settlement',
		fromBeat: 'skybound',
		untilBeatExclusive: 'homecoming',
		priority: 42,
	},
	{
		npcId: 'portia-drift',
		locationId: 'mirror-palace:station',
		fromBeat: 'skybound',
		untilBeatExclusive: 'homecoming',
		priority: 42,
	},
	{
		npcId: 'mister-vellum',
		locationId: 'mirror-palace:settlement',
		fromBeat: 'skybound',
		untilBeatExclusive: 'homecoming',
		priority: 42,
	},
	{
		npcId: 'reflection-judge',
		locationId: 'mirror-palace:settlement',
		fromBeat: 'skybound',
		untilBeatExclusive: 'colony-watch',
		priority: 43,
	},
	{
		npcId: 'auntie-subharmonic',
		locationId: 'dub-colony:safehouse',
		fromBeat: 'colony-watch',
		untilBeatExclusive: 'homecoming',
		priority: 45,
	},
	{
		npcId: 'vera-counterweight',
		locationId: 'dub-colony:station',
		fromBeat: 'colony-watch',
		untilBeatExclusive: 'homecoming',
		priority: 48,
	},
	{
		npcId: 'juno-jar',
		locationId: 'dub-colony:safehouse',
		fromBeat: 'colony-watch',
		untilBeatExclusive: 'homecoming',
		priority: 45,
	},
	{
		npcId: 'naya-root',
		locationId: 'dub-colony:settlement',
		fromBeat: 'colony-watch',
		untilBeatExclusive: 'homecoming',
		priority: 45,
	},
	{
		npcId: 'bassie-knot',
		locationId: 'dub-colony:settlement',
		fromBeat: 'colony-watch',
		untilBeatExclusive: 'homecoming',
		priority: 45,
	},
	{
		npcId: 'old-quasar-jones',
		locationId: 'dub-colony:station',
		fromBeat: 'colony-watch',
		untilBeatExclusive: 'homecoming',
		priority: 45,
	},
	{
		npcId: 'coco-loop',
		locationId: 'dub-colony:settlement',
		fromBeat: 'colony-watch',
		untilBeatExclusive: 'homecoming',
		priority: 45,
	},
	{
		npcId: 'ames-oxygen',
		locationId: 'dub-colony:settlement',
		fromBeat: 'colony-watch',
		untilBeatExclusive: 'homecoming',
		priority: 45,
	},
	{
		npcId: 'lio-vale',
		locationId: 'orbital-lift:settlement',
		fromBeat: 'homecoming',
		priority: 50,
	},
	{
		npcId: 'rook-null',
		locationId: 'lower-sprawl:station',
		fromBeat: 'homecoming',
		priority: 50,
	},
	{
		npcId: 'naya-root',
		locationId: 'lower-sprawl:station',
		fromBeat: 'homecoming',
		priority: 50,
	},
	{
		npcId: 'juno-jar',
		locationId: 'lower-sprawl:station',
		fromBeat: 'homecoming',
		priority: 50,
	},
	{
		npcId: 'orchid-debt',
		locationId: 'lower-sprawl:station',
		fromBeat: 'homecoming',
		priority: 52,
	},
	{
		npcId: 'vera-counterweight',
		locationId: 'lower-sprawl:station',
		fromBeat: 'homecoming',
		priority: 56,
	},
	{
		npcId: 'marlo-turnstile',
		locationId: 'lower-sprawl:station',
		fromBeat: 'city-night',
		priority: 54,
	},
	{
		npcId: 'portia-drift',
		locationId: 'orbital-lift:station',
		fromBeat: 'homecoming',
		priority: 52,
	},
	{
		npcId: 'bassie-knot',
		locationId: 'lower-sprawl:station',
		fromBeat: 'homecoming',
		priority: 52,
	},
	{
		npcId: 'ames-oxygen',
		locationId: 'orbital-lift:settlement',
		fromBeat: 'homecoming',
		priority: 52,
	},
	{
		npcId: 'old-quasar-jones',
		locationId: 'orbital-lift:station',
		fromBeat: 'homecoming',
		priority: 52,
	},
	{
		npcId: 'coco-loop',
		locationId: 'lower-sprawl:station',
		fromBeat: 'homecoming',
		priority: 52,
	},
	{
		npcId: 'little-ix',
		locationId: 'lower-sprawl:station',
		fromBeat: 'commons-dawn',
		priority: 60,
	},
	...LATE_ACT_SCHEDULE_RULES,
	...ALGORITHMIC_CIVIC_SCHEDULE_RULES,
];

export function resolveWorldBeat(story: StoryProgress): WorldBeat {
	const completed = new Set(story.completedStageIds);
	if (story.campaignComplete || completed.has('asteroid-redoubt')) return 'commons-dawn';
	if (story.currentStageId === 'asteroid-redoubt' && completed.has('orbital-lift')) {
		return 'last-route';
	}
	if (completed.has('orbital-lift')) return 'homecoming';
	if (completed.has('antenna-barrens')) return 'public-forecast';
	if (completed.has('mirror-palace') || completed.has('dub-colony')) return 'colony-watch';
	if (completed.has('chrome-arcology')) return 'skybound';
	if (completed.has('drainmarket') || story.currentStageId === 'chrome-arcology') {
		return 'vertical-shift';
	}
	if (completed.has('lower-sprawl') || story.currentStageId === 'drainmarket') {
		return 'floodline-open';
	}
	return 'city-night';
}

export function resolveWorldSchedule(
	adventure: AdventureSaveV2,
	story: StoryProgress
): WorldScheduleSnapshot {
	const beat = resolveWorldBeat(story);
	const flags = new Set(adventure.worldFlags);
	const matching = NPC_SCHEDULE_RULES.filter((rule) => ruleActive(rule, beat, flags)).sort(
		(a, b) => a.priority - b.priority
	);
	const scheduledLocationByNpcId: Record<string, string> = {};
	for (const rule of matching) scheduledLocationByNpcId[rule.npcId] = rule.locationId;
	return {
		beat,
		label: BEAT_COPY[beat].label,
		notice: BEAT_COPY[beat].notice,
		scheduledLocationByNpcId,
	};
}

export function validateWorldSchedule(): string[] {
	const errors: string[] = [];
	for (const rule of NPC_SCHEDULE_RULES) {
		if (!Number.isInteger(rule.priority)) errors.push(`${rule.npcId}: schedule priority must be an integer`);
		if (
			rule.untilBeatExclusive &&
			beatRank(rule.untilBeatExclusive) <= beatRank(rule.fromBeat)
		) {
			errors.push(`${rule.npcId}: schedule window ends before it begins`);
		}
	}
	return errors;
}

function ruleActive(
	rule: NpcScheduleRule,
	beat: WorldBeat,
	flags: ReadonlySet<string>
): boolean {
	if (beatRank(beat) < beatRank(rule.fromBeat)) return false;
	if (rule.untilBeatExclusive && beatRank(beat) >= beatRank(rule.untilBeatExclusive)) return false;
	if (rule.requiresWorldFlags?.some((flag) => !flags.has(flag))) return false;
	if (rule.forbidsWorldFlags?.some((flag) => flags.has(flag))) return false;
	return true;
}

function beatRank(beat: WorldBeat): number {
	return BEAT_ORDER.indexOf(beat);
}
