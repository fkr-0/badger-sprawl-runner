import type { FinalBroadcastBranch, StoryProgress } from '../GameFlow';
import type { AdventureSaveV2 } from './AdventureState';

export type CampaignPhaseId = 6 | 7 | 8 | 9;

export interface CampaignPhaseCriterion {
	id: string;
	label: string;
	met: boolean;
	evidence: string;
}

export interface CampaignPhaseAcceptanceReport {
	phase: CampaignPhaseId;
	ready: boolean;
	metCount: number;
	totalCount: number;
	criteria: CampaignPhaseCriterion[];
	nextBlockingCriterionId?: string;
}

export interface Phase9SystemEvidence {
	contentValidationPassed: boolean;
	activeExpeditionSaveSeparated: boolean;
	deterministicManifestExposed: boolean;
	migrationFixtureCount: number;
	releaseEvidenceCount: number;
}

export interface FinalDoctrineReadiness {
	doctrine: FinalBroadcastBranch;
	score: number;
	materiallyGrounded: boolean;
	support: string[];
	warnings: string[];
}

const CITY_STAGES = ['lower-sprawl', 'drainmarket', 'chrome-arcology'] as const;
const COLONY_STAGES = ['mirror-palace', 'dub-colony', 'antenna-barrens'] as const;

export function evaluateCampaignPhases(
	adventure: AdventureSaveV2,
	story: StoryProgress,
	phase9Evidence: Partial<Phase9SystemEvidence> = {}
): CampaignPhaseAcceptanceReport[] {
	return [
		evaluatePhase6(adventure, story),
		evaluatePhase7(adventure, story),
		evaluatePhase8(adventure, story),
		evaluatePhase9(adventure, story, phase9Evidence),
	];
}

export function evaluatePhase6(
	adventure: AdventureSaveV2,
	story: StoryProgress
): CampaignPhaseAcceptanceReport {
	const completed = new Set(story.completedStageIds);
	const flags = new Set(adventure.worldFlags);
	return report(6, [
		criterion(
			'city-stages-complete',
			'Lower Sprawl, Drainmarket, and Chrome Arcology are complete',
			CITY_STAGES.every((stageId) => completed.has(stageId)),
			CITY_STAGES.filter((stageId) => completed.has(stageId)).join(', ') || 'none'
		),
		criterion(
			'city-districts-transformed',
			'The three city districts expose transformed revisits',
			CITY_STAGES.every((districtId) => adventure.districtPhases[districtId] === 'transformed'),
			CITY_STAGES.map((districtId) => `${districtId}:${adventure.districtPhases[districtId] ?? 'missing'}`).join(' | ')
		),
		criterion(
			'elevator-seed-public',
			'The Elevator Seed is governed as a public routing constitution',
			flags.has('main:elevator-seed-secured') || flags.has('chrome-arcology:vertical-commons'),
			flags.has('main:elevator-seed-secured')
				? 'main:elevator-seed-secured'
				: flags.has('chrome-arcology:vertical-commons')
					? 'chrome-arcology:vertical-commons'
					: 'missing'
		),
		criterion(
			'orbit-route-open',
			'The city act opens the first upward route without closing the city',
			adventure.unlockedRouteIds.includes('transit:chrome-arcology:mirror-palace'),
			adventure.unlockedRouteIds.includes('transit:chrome-arcology:mirror-palace')
				? 'transit:chrome-arcology:mirror-palace'
				: 'missing'
		),
	]);
}

export function evaluatePhase7(
	adventure: AdventureSaveV2,
	story: StoryProgress
): CampaignPhaseAcceptanceReport {
	const completed = new Set(story.completedStageIds);
	const flags = new Set(adventure.worldFlags);
	const returnEffects = [
		'homecoming:greenhouse-line-ready',
		'homecoming:rotating-authority-ready',
		'homecoming:contradiction-log-public',
		'dub-colony:return-coupler-ready',
		'antenna-barrens:listener-cache-public',
	].filter((flag) => flags.has(flag));
	return report(7, [
		criterion(
			'colony-stages-complete',
			'Mirror Palace, Dub Colony, and Antenna Barrens are complete',
			COLONY_STAGES.every((stageId) => completed.has(stageId)),
			COLONY_STAGES.filter((stageId) => completed.has(stageId)).join(', ') || 'none'
		),
		criterion(
			'city-systems-mirrored',
			'Tram, life support, greenhouse, broadcast, docking, and forecast become visible civic mirrors',
			[
				'mirror-palace:public-staff-local',
				'dub-colony:commons-governance',
				'antenna-barrens:public-forecast',
			].every((flag) => flags.has(flag)),
			[
				'mirror-palace:public-staff-local',
				'dub-colony:commons-governance',
				'antenna-barrens:public-forecast',
			].filter((flag) => flags.has(flag)).join(', ') || 'none'
		),
		criterion(
			'colony-return-effects',
			'At least three colony outcomes are prepared to alter homecoming',
			returnEffects.length >= 3,
			`${returnEffects.length}/3: ${returnEffects.join(', ') || 'none'}`
		),
		criterion(
			'knowledge-conflict-public',
			'Prediction, archive, and protected-route disagreements have public procedures',
			flags.has('antenna-barrens:appeals-open') &&
				(flags.has('mirror-palace:withdrawable-refusal-archive') ||
					flags.has('antenna-barrens:model-completeness-refuted')),
			[
				'antenna-barrens:appeals-open',
				'mirror-palace:withdrawable-refusal-archive',
				'antenna-barrens:model-completeness-refuted',
			].filter((flag) => flags.has(flag)).join(', ') || 'none'
		),
	]);
}

export function evaluatePhase8(
	adventure: AdventureSaveV2,
	story: StoryProgress
): CampaignPhaseAcceptanceReport {
	const completed = new Set(story.completedStageIds);
	const flags = new Set(adventure.worldFlags);
	const coalitionCapabilities = countCoalitionCapabilities(adventure);
	return report(8, [
		criterion(
			'homecoming-complete',
			'Orbital Lift resolves and the return delegation reaches Blue Mercy',
			completed.has('orbital-lift') && flags.has('homecoming:return-delegation-arrived'),
			`${completed.has('orbital-lift') ? 'orbital-lift complete' : 'orbital-lift missing'}; ${flags.has('homecoming:return-delegation-arrived') ? 'delegation arrived' : 'delegation missing'}`
		),
		criterion(
			'required-city-revisit',
			'The transformed city is revisited before the final launch',
			adventure.visitedLocationIds.includes('lower-sprawl:station') &&
				adventure.districtPhases['lower-sprawl'] === 'transformed',
			`${adventure.visitedLocationIds.includes('lower-sprawl:station') ? 'station visited' : 'station not visited'}; lower-sprawl:${adventure.districtPhases['lower-sprawl'] ?? 'missing'}`
		),
		criterion(
			'canonical-homecoming-topology',
			'Homecoming and final launch routes are both open',
			adventure.unlockedRouteIds.includes('homecoming:orbital-lift:lower-sprawl') &&
				adventure.unlockedRouteIds.includes('launch:lower-sprawl:asteroid-redoubt'),
			[
				'homecoming:orbital-lift:lower-sprawl',
				'launch:lower-sprawl:asteroid-redoubt',
			].filter((routeId) => adventure.unlockedRouteIds.includes(routeId)).join(', ') || 'none'
		),
		criterion(
			'coalition-material-capacity',
			'At least four independent service capacities materially enable the final expedition',
			coalitionCapabilities.length >= 4,
			`${coalitionCapabilities.length}/4: ${coalitionCapabilities.join(', ') || 'none'}`
		),
		criterion(
			'final-doctrine-resolved',
			'Director Vane is resolved and a final doctrine is recorded',
			completed.has('asteroid-redoubt') && Boolean(story.finalBroadcastDoctrine),
			`${completed.has('asteroid-redoubt') ? 'redoubt complete' : 'redoubt incomplete'}; ${story.finalBroadcastDoctrine ?? 'no doctrine'}`
		),
	]);
}

export function evaluatePhase9(
	adventure: AdventureSaveV2,
	story: StoryProgress,
	evidence: Partial<Phase9SystemEvidence> = {}
): CampaignPhaseAcceptanceReport {
	const flags = new Set(adventure.worldFlags);
	return report(9, [
		criterion(
			'authored-campaign-stable',
			'The authored campaign is complete without procedural dependence',
			story.campaignComplete && story.completedStageIds.includes('asteroid-redoubt'),
			story.campaignComplete ? 'campaign complete' : 'campaign incomplete'
		),
		criterion(
			'commons-line-active',
			'Postgame Commons Line services and revision procedures are active',
			flags.has('commons:return-signal-open') && flags.has('commons:toolkits-mirrored'),
			['commons:return-signal-open', 'commons:toolkits-mirrored']
				.filter((flag) => flags.has(flag))
				.join(', ') || 'none'
		),
		criterion(
			'active-save-separated',
			'Active procedural expeditions are stored separately from canonical world truth',
			evidence.activeExpeditionSaveSeparated === true,
			evidence.activeExpeditionSaveSeparated ? 'separate active save verified' : 'not verified'
		),
		criterion(
			'deterministic-manifest',
			'Seeded manifests are exposed for reproduction and debugging',
			evidence.deterministicManifestExposed === true,
			evidence.deterministicManifestExposed ? 'manifest seed exposed' : 'not verified'
		),
		criterion(
			'content-validation',
			'Cross-catalog content validation passes',
			evidence.contentValidationPassed === true,
			evidence.contentValidationPassed ? 'validation passed' : 'not verified'
		),
		criterion(
			'release-evidence',
			'Migration fixtures and release evidence are present',
			(evidence.migrationFixtureCount ?? 0) >= 2 && (evidence.releaseEvidenceCount ?? 0) >= 4,
			`${evidence.migrationFixtureCount ?? 0} migration fixtures; ${evidence.releaseEvidenceCount ?? 0} evidence classes`
		),
	]);
}

export function evaluateFinalDoctrineReadiness(
	adventure: AdventureSaveV2,
	doctrine: FinalBroadcastBranch
): FinalDoctrineReadiness {
	const flags = new Set(adventure.worldFlags);
	const capabilities = doctrineCapabilities(doctrine);
	const support = capabilities.filter((capability) => capability.met(adventure, flags)).map((capability) => capability.label);
	const warnings = capabilities
		.filter((capability) => !capability.met(adventure, flags))
		.map((capability) => capability.warning);
	return {
		doctrine,
		score: support.length,
		materiallyGrounded: support.length >= 4,
		support,
		warnings,
	};
}

function doctrineCapabilities(doctrine: FinalBroadcastBranch): Array<{
	label: string;
	warning: string;
	met: (adventure: AdventureSaveV2, flags: ReadonlySet<string>) => boolean;
}> {
	const common = [
		{
			label: 'Blue Mercy public transit',
			warning: 'The city route is not yet demonstrably public.',
			met: (_adventure: AdventureSaveV2, flags: ReadonlySet<string>) =>
				flags.has('lower-sprawl:blue-mercy-public'),
		},
		{
			label: 'Homecoming delegation testimony',
			warning: 'The final doctrine lacks the returned delegation’s material testimony.',
			met: (_adventure: AdventureSaveV2, flags: ReadonlySet<string>) =>
				flags.has('homecoming:return-delegation-arrived'),
		},
	];
	const specific =
		doctrine === 'publish-tools'
			? [
					{
						label: 'Public dismantling toolkits',
						warning: 'Tool publication lacks distributed physical kits.',
						met: (_adventure: AdventureSaveV2, flags: ReadonlySet<string>) =>
							flags.has('asteroid-redoubt:public-toolkits-distributed') ||
							flags.has('commons:toolkits-mirrored'),
					},
					{
						label: 'Repair and signal capacity',
						warning: 'Published tools have too little repair and signal infrastructure behind them.',
						met: (adventure: AdventureSaveV2) =>
							serviceCapacity(adventure, 'repair-bench') >= 2 &&
							serviceCapacity(adventure, 'signal-lab') >= 2,
					},
					{
						label: 'Consent-aware archives',
						warning: 'Tool publication risks exposing protected people without archive safeguards.',
						met: (_adventure: AdventureSaveV2, flags: ReadonlySet<string>) =>
							flags.has('mirror-palace:withdrawable-refusal-archive') ||
							flags.has('antenna-barrens:listener-cache-public'),
					},
			  ]
			: doctrine === 'chorus-control'
				? [
						{
							label: 'Commons governance',
							warning: 'Chorus control lacks an adopted commons governance process.',
							met: (_adventure: AdventureSaveV2, flags: ReadonlySet<string>) =>
								flags.has('dub-colony:commons-governance'),
						},
						{
							label: 'Rotating authority coloring',
							warning: 'Shared control has no conflict-free rotation or expiry.',
							met: (_adventure: AdventureSaveV2, flags: ReadonlySet<string>) =>
								flags.has('dub-colony:authority-graph-colored'),
						},
						{
							label: 'Public transit interruption',
							warning: 'The chorus lacks independent transit interruption capacity.',
							met: (adventure: AdventureSaveV2) =>
								serviceCapacity(adventure, 'transit-control') >= 3,
						},
				  ]
				: [
						{
							label: 'Pre-harm appeals',
							warning: 'Abolition lacks an appeal path capable of stopping harm before execution.',
							met: (_adventure: AdventureSaveV2, flags: ReadonlySet<string>) =>
								flags.has('antenna-barrens:pre-harm-appeals'),
						},
						{
							label: 'Public refusal channels',
							warning: 'Abolition lacks a machine-legible right to refuse commands.',
							met: (_adventure: AdventureSaveV2, flags: ReadonlySet<string>) =>
								flags.has('orbital-lift:angel-refusal-public'),
						},
						{
							label: 'Completeness claim refuted',
							warning: 'Skylock’s claim to complete representation remains technically unchallenged.',
							met: (_adventure: AdventureSaveV2, flags: ReadonlySet<string>) =>
								flags.has('antenna-barrens:model-completeness-refuted') ||
								flags.has('commons:incompleteness-public'),
						},
				  ];
	return [...common, ...specific];
}

function countCoalitionCapabilities(adventure: AdventureSaveV2): string[] {
	const flags = new Set(adventure.worldFlags);
	const capabilities: string[] = [];
	if (serviceCapacity(adventure, 'greenhouse') >= 2 || flags.has('homecoming:greenhouse-line-ready')) {
		capabilities.push('greenhouse');
	}
	if (serviceCapacity(adventure, 'archive') >= 2) capabilities.push('archive');
	if (serviceCapacity(adventure, 'clinic') >= 1) capabilities.push('clinic');
	if (serviceCapacity(adventure, 'field-shop') >= 1) capabilities.push('shop');
	if (serviceCapacity(adventure, 'transit-control') >= 2) capabilities.push('transit');
	if (serviceCapacity(adventure, 'signal-lab') >= 2) capabilities.push('signal');
	if (flags.has('orbital-lift:protected-witness-car')) capabilities.push('witness-car');
	if (flags.has('asteroid-redoubt:protected-map-public')) capabilities.push('protected-map');
	return capabilities;
}

function serviceCapacity(adventure: AdventureSaveV2, serviceId: string): number {
	return Object.values(adventure.locationStates).reduce(
		(total, location) => total + (location.serviceLevels[serviceId] ?? 0),
		0
	);
}

function criterion(
	id: string,
	label: string,
	met: boolean,
	evidence: string
): CampaignPhaseCriterion {
	return { id, label, met, evidence };
}

function report(
	phase: CampaignPhaseId,
	criteria: CampaignPhaseCriterion[]
): CampaignPhaseAcceptanceReport {
	const metCount = criteria.filter((entry) => entry.met).length;
	return {
		phase,
		ready: metCount === criteria.length,
		metCount,
		totalCount: criteria.length,
		criteria,
		nextBlockingCriterionId: criteria.find((entry) => !entry.met)?.id,
	};
}
