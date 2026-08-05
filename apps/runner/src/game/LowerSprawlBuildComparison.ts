import type { ResolutionApproach } from './ResolutionApproach';
import {
	compareBuildTelemetry,
	type BuildTelemetryComparison,
	type BuildTelemetrySnapshot,
} from '../systems/BuildComparisonTelemetrySystem';
import { getStageEncounterTopology } from '../world/EncounterTopologyCatalog';

export type LowerSprawlBuildId = 'ghost-signal' | 'commons-claw' | 'rail-breach';

export interface LowerSprawlBuildDefinition {
	id: LowerSprawlBuildId;
	label: string;
	tagline: string;
	mark: string;
	loadoutItemIds: string[];
	skillRanks: Record<string, number>;
	approaches: ResolutionApproach[];
	preferredPlanIds: string[];
	pressureProfile: string;
	civicConsequence: string;
	failureMode: string;
	practiceCue: string;
}

export interface LowerSprawlBuildCard extends LowerSprawlBuildDefinition {
	preferredPlans: Array<{
		id: string;
		label: string;
		risk: 'low' | 'medium' | 'high';
		playerCue: string;
		worldConsequenceHint: string;
	}>;
	evidenceKind: 'authored-baseline' | 'observed-run';
	observed?: BuildTelemetrySnapshot;
	evidenceLines: string[];
}

export interface LowerSprawlBuildComparisonSnapshot {
	title: string;
	subtitle: string;
	cards: LowerSprawlBuildCard[];
	observedComparisons: BuildTelemetryComparison[];
	legend: string[];
}

export const LOWER_SPRAWL_BUILD_DEFINITIONS: readonly LowerSprawlBuildDefinition[] = [
	{
		id: 'ghost-signal',
		label: 'Ghost Signal',
		tagline: 'Rewrite the report before the room agrees it happened.',
		mark: '◇',
		loadoutItemIds: ['signal_jammer', 'phase_pick', 'ledger_lens'],
		skillRanks: { packet_sense: 2, zero_day_lullaby: 1, soft_paw: 1 },
		approaches: ['hacking', 'ghoststep', 'exploration'],
		preferredPlanIds: ['lower-sprawl:work-plan-1', 'lower-sprawl:stronghold-plan-1'],
		pressureProfile:
			'Low alarm exposure and low civilian stress; slower salvage collection and high dependence on route reading.',
		civicConsequence:
			'Leaves the toll brain serviceable and demonstrates that quiet access can become public infrastructure.',
		failureMode:
			'A missed spoof can concentrate several uncertain reports around one false-safe route.',
		practiceCue: 'Train door timing, trap spoofing, coyote recovery, and clean disengagement.',
	},
	{
		id: 'commons-claw',
		label: 'Commons Claw',
		tagline: 'Win the argument in public, then stop hitting when the room can answer.',
		mark: '✦',
		loadoutItemIds: ['claws', 'nanofur_weave', 'solder_mite_swarm'],
		skillRanks: { double_swipe: 1, parry_tooth: 1, slip_guard: 2 },
		approaches: ['claw', 'social', 'repair'],
		preferredPlanIds: ['lower-sprawl:work-plan-2', 'lower-sprawl:stronghold-plan-1'],
		pressureProfile:
			'Medium exposure with strong stand-down potential; rewards move variety and disciplined checkpoint banking.',
		civicConsequence:
			'Builds witness legitimacy and converts defeated infrastructure through visible repair instead of private seizure.',
		failureMode:
			'Repeating one control loop teaches elites the rhythm and can turn public defense into spectacle.',
		practiceCue: 'Train move-family variation, parry-to-repair windows, witness spacing, and nonlethal exits.',
	},
	{
		id: 'rail-breach',
		label: 'Rail Breach',
		tagline: 'Break the collection rhythm before it can become a doctrine.',
		mark: '▰',
		loadoutItemIds: ['railgun', 'rail_heat_sink', 'capacitor_coil'],
		skillRanks: { rail_mastery: 1, quickdraw_bus: 2, breach_math: 2 },
		approaches: ['ballistics', 'claw'],
		preferredPlanIds: ['lower-sprawl:work-plan-2', 'lower-sprawl:stronghold-plan-2'],
		pressureProfile:
			'High sound and repair exposure with fast room control, strong salvage tempo, and greater death-loss risk.',
		civicConsequence:
			'Ends collection quickly but may leave Blue Mercy with damaged relay armor and higher public repair strain.',
		failureMode:
			'Rail repetition retains damage but loses stun and poise control against elites; civilian routes must remain clear.',
		practiceCue: 'Train pierce lanes, recoil recovery, alternate control moves, and safe alarm-device shots.',
	},
];

export function buildLowerSprawlBuildComparison(
	observedRuns: readonly BuildTelemetrySnapshot[] = []
): LowerSprawlBuildComparisonSnapshot {
	const topology = getStageEncounterTopology('lower-sprawl');
	const eligibleRuns = observedRuns.filter((run) => run.stageId === 'lower-sprawl');
	const cards = LOWER_SPRAWL_BUILD_DEFINITIONS.map((definition) => {
		const observed = eligibleRuns.find((run) => runMatchesBuild(run, definition));
		const preferredPlans = definition.preferredPlanIds
			.map((planId) => topology.approachPlans.find((plan) => plan.id === planId))
			.filter((plan): plan is NonNullable<typeof plan> => Boolean(plan))
			.map((plan) => ({
				id: plan.id,
				label: plan.label,
				risk: plan.risk,
				playerCue: plan.playerCue,
				worldConsequenceHint: plan.worldConsequenceHint,
			}));
		return {
			...definition,
			loadoutItemIds: [...definition.loadoutItemIds],
			skillRanks: { ...definition.skillRanks },
			approaches: [...definition.approaches],
			preferredPlanIds: [...definition.preferredPlanIds],
			preferredPlans,
			evidenceKind: observed ? ('observed-run' as const) : ('authored-baseline' as const),
			observed: observed ? cloneTelemetry(observed) : undefined,
			evidenceLines: observed ? observedEvidence(observed) : authoredEvidence(definition),
		};
	});
	const observedCards = cards.filter(
		(card): card is LowerSprawlBuildCard & { observed: BuildTelemetrySnapshot } =>
			Boolean(card.observed)
	);
	const observedComparisons: BuildTelemetryComparison[] = [];
	for (let leftIndex = 0; leftIndex < observedCards.length; leftIndex += 1) {
		for (let rightIndex = leftIndex + 1; rightIndex < observedCards.length; rightIndex += 1) {
			const left = observedCards[leftIndex];
			const right = observedCards[rightIndex];
			if (left && right) observedComparisons.push(compareBuildTelemetry(left.observed, right.observed));
		}
	}
	return {
		title: 'Lower Sprawl // Three Ways Through One City',
		subtitle:
			'Compare access, pressure, public consequence, and execution evidence. Damage is one row, not the verdict.',
		cards,
		observedComparisons,
		legend: [
			'AUTHORED BASELINE describes intended affordances, not measured performance.',
			'OBSERVED RUN uses StageRun telemetry and never changes tuning.',
			'Risk describes exposed consequences, not a quality ranking.',
		],
	};
}

function runMatchesBuild(
	run: BuildTelemetrySnapshot,
	definition: LowerSprawlBuildDefinition
): boolean {
	const equipped = new Set(run.loadoutItemIds);
	const signatureMatches = definition.loadoutItemIds.filter((itemId) => equipped.has(itemId)).length;
	const approachMatches = definition.approaches.filter((approach) =>
		run.approaches.includes(approach)
	).length;
	return signatureMatches >= 2 && approachMatches >= 1;
}

function authoredEvidence(definition: LowerSprawlBuildDefinition): string[] {
	return [
		`BASELINE // ${definition.preferredPlanIds.length} authored route plans`,
		`PRESSURE // ${definition.pressureProfile}`,
		`PUBLIC // ${definition.civicConsequence}`,
	];
}

function observedEvidence(run: BuildTelemetrySnapshot): string[] {
	return [
		`RUN // ${run.durationSeconds.toFixed(2)}s · ${run.deaths} deaths · ${run.damageTaken} damage taken`,
		`KNOWLEDGE // ${run.alarmsTriggered} triggered · ${run.alarmsSpoofed} spoofed · ${run.alarmsDisabled} disabled`,
		`PUBLIC // ${run.standDownAppeals} stand-downs · ${run.civiliansEvacuated} evacuations`,
		`PRESSURE // ${run.salvageBanked} banked · ${run.salvageLost} lost`,
	];
}

function cloneTelemetry(run: BuildTelemetrySnapshot): BuildTelemetrySnapshot {
	return {
		...run,
		loadoutItemIds: [...run.loadoutItemIds],
		skillRanks: { ...run.skillRanks },
		approaches: [...run.approaches],
	};
}
