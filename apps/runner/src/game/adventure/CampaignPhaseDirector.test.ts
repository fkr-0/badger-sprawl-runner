import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../GameFlow';
import { createDefaultAdventureSave } from './AdventureState';
import {
	evaluateCampaignPhases,
	evaluateFinalDoctrineReadiness,
	evaluatePhase6,
	evaluatePhase7,
	evaluatePhase8,
	evaluatePhase9,
} from './CampaignPhaseDirector';

function story(overrides: Parameters<typeof createGameFlow>[1] = {}) {
	return createGameFlow(undefined, overrides).getStoryProgress();
}

function cityActAdventure() {
	return createDefaultAdventureSave({
		districtPhases: {
			'lower-sprawl': 'transformed',
			drainmarket: 'transformed',
			'chrome-arcology': 'transformed',
			'mirror-palace': 'contested',
		},
		unlockedRouteIds: [
			'lower-sprawl:safehouse-settlement',
			'transit:chrome-arcology:mirror-palace',
		],
		worldFlags: ['main:elevator-seed-secured', 'chrome-arcology:vertical-commons'],
	});
}

describe('CampaignPhaseDirector', () => {
	it('accepts the city act only when progression, transformation, the Seed, and orbit route agree', () => {
		const report = evaluatePhase6(
			cityActAdventure(),
			story({
				currentStageId: 'mirror-palace',
				completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology'],
			})
		);

		expect(report).toMatchObject({ phase: 6, ready: true, metCount: 4, totalCount: 4 });
		expect(report.nextBlockingCriterionId).toBeUndefined();
	});

	it('reports the exact first missing colony-act acceptance criterion', () => {
		const adventure = createDefaultAdventureSave({
			worldFlags: [
				'mirror-palace:public-staff-local',
				'dub-colony:commons-governance',
				'antenna-barrens:public-forecast',
				'homecoming:greenhouse-line-ready',
				'homecoming:rotating-authority-ready',
				'homecoming:contradiction-log-public',
			],
		});
		const report = evaluatePhase7(
			adventure,
			story({
				currentStageId: 'orbital-lift',
				completedStageIds: ['mirror-palace', 'dub-colony', 'antenna-barrens'],
			})
		);

		expect(report.ready).toBe(false);
		expect(report.nextBlockingCriterionId).toBe('knowledge-conflict-public');
		expect(report.criteria.find((criterion) => criterion.id === 'colony-return-effects')).toMatchObject({
			met: true,
		});
	});

	it('requires a transformed city revisit and material coalition capacity before the finale', () => {
		const adventure = createDefaultAdventureSave({
			visitedLocationIds: ['lower-sprawl:safehouse', 'lower-sprawl:station'],
			districtPhases: { 'lower-sprawl': 'transformed', 'orbital-lift': 'transformed' },
			unlockedRouteIds: [
				'homecoming:orbital-lift:lower-sprawl',
				'launch:lower-sprawl:asteroid-redoubt',
			],
			worldFlags: [
				'homecoming:return-delegation-arrived',
				'homecoming:greenhouse-line-ready',
				'orbital-lift:protected-witness-car',
				'asteroid-redoubt:protected-map-public',
			],
			locationStates: {
				'lower-sprawl:station': {
					visitCount: 2,
					flags: [],
					serviceLevels: { 'transit-control': 2, archive: 1, 'signal-lab': 1 },
					serviceStrain: {},
				},
				'drainmarket:safehouse': {
					visitCount: 1,
					flags: [],
					serviceLevels: { clinic: 1, greenhouse: 1 },
					serviceStrain: {},
				},
				'dub-colony:settlement': {
					visitCount: 1,
					flags: [],
					serviceLevels: { greenhouse: 1, archive: 1, 'signal-lab': 1 },
					serviceStrain: {},
				},
			},
		});
		const report = evaluatePhase8(
			adventure,
			story({
				campaignComplete: true,
				currentStageId: 'asteroid-redoubt',
				completedStageIds: ['orbital-lift', 'asteroid-redoubt'],
				finalBroadcastDoctrine: 'publish-tools',
			})
		);

		expect(report).toMatchObject({ phase: 8, ready: true, metCount: 5, totalCount: 5 });
	});

	it('keeps Phase 9 closed until separate saves, manifests, validation, and evidence are verified', () => {
		const adventure = createDefaultAdventureSave({
			worldFlags: ['commons:return-signal-open', 'commons:toolkits-mirrored'],
		});
		const completeStory = story({
			campaignComplete: true,
			currentStageId: 'asteroid-redoubt',
			completedStageIds: ['asteroid-redoubt'],
			finalBroadcastDoctrine: 'publish-tools',
		});
		const blocked = evaluatePhase9(adventure, completeStory);
		expect(blocked.ready).toBe(false);
		expect(blocked.nextBlockingCriterionId).toBe('active-save-separated');

		const ready = evaluatePhase9(adventure, completeStory, {
			activeExpeditionSaveSeparated: true,
			deterministicManifestExposed: true,
			contentValidationPassed: true,
			migrationFixtureCount: 2,
			releaseEvidenceCount: 4,
		});
		expect(ready.ready).toBe(true);
	});

	it('grounds final doctrines in accumulated services and public procedures', () => {
		const adventure = createDefaultAdventureSave({
			worldFlags: [
				'lower-sprawl:blue-mercy-public',
				'homecoming:return-delegation-arrived',
				'asteroid-redoubt:public-toolkits-distributed',
				'mirror-palace:withdrawable-refusal-archive',
			],
			locationStates: {
				'lower-sprawl:safehouse': {
					visitCount: 1,
					flags: [],
					serviceLevels: { 'repair-bench': 1, 'signal-lab': 1 },
					serviceStrain: {},
				},
				'asteroid-redoubt:station': {
					visitCount: 1,
					flags: [],
					serviceLevels: { 'repair-bench': 1, 'signal-lab': 1 },
					serviceStrain: {},
				},
			},
		});

		expect(evaluateFinalDoctrineReadiness(adventure, 'publish-tools')).toMatchObject({
			doctrine: 'publish-tools',
			score: 5,
			materiallyGrounded: true,
			warnings: [],
		});
		expect(evaluateFinalDoctrineReadiness(adventure, 'abolish-skylock')).toMatchObject({
			materiallyGrounded: false,
		});
	});

	it('returns all Phase 6–9 reports in order', () => {
		const reports = evaluateCampaignPhases(createDefaultAdventureSave(), story());
		expect(reports.map((report) => report.phase)).toEqual([6, 7, 8, 9]);
	});
});
