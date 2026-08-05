import { describe, expect, it } from 'vitest';
import { RuntimeQuestBridge } from './RuntimeQuestBridge';
import { WorldDirector } from './WorldDirector';

describe('RuntimeQuestBridge', () => {
	it('reconciles the legacy Drainmarket stage into persistent local quests', () => {
		const world = new WorldDirector();
		const bridge = new RuntimeQuestBridge(world);

		const report = bridge.apply({
			stageId: 'drainmarket',
			completedQuestIds: ['clinic-without-cameras'],
			completedMinigameIds: ['injury-ledger-triage'],
			completedTutorialIds: [],
		});

		expect(report.questResults).toHaveLength(2);
		expect(world.getState()).toMatchObject({
			questStates: {
				'drainmarket:main-knife-weather': { status: 'completed' },
				'drainmarket:side-clinic-without-cameras': { status: 'completed' },
			},
			locationStates: {
				'drainmarket:settlement': { serviceLevels: { 'field-shop': 1 } },
				'drainmarket:station': { serviceLevels: { 'transit-control': 1 } },
			},
			npcStates: {
				'silk-suture': { currentLocationId: 'drainmarket:station' },
			},
		});
		expect(world.getState().worldFlags).toEqual(
			expect.arrayContaining([
				'drainmarket:open-vein',
				'drainmarket:redundant-cold-chain',
				'runtime-minigame:drainmarket:injury-ledger-triage',
			])
		);
	});

	it.each([
		{
			stageId: 'antenna-barrens',
			legacyQuestId: 'pirate-signal-cache',
			mainQuestId: 'antenna-barrens:main-forecast-is-not-permission',
			sideQuestId: 'antenna-barrens:side-pirate-signal-cache',
			flags: ['antenna-barrens:public-forecast', 'antenna-barrens:listener-cache-public'],
		},
		{
			stageId: 'orbital-lift',
			legacyQuestId: 'cargo-reversal-witnesses',
			mainQuestId: 'orbital-lift:main-cargo-declares-itself-passengers',
			sideQuestId: 'orbital-lift:side-cargo-reversal-witnesses',
			flags: ['orbital-lift:passenger-manifest', 'orbital-lift:protected-witness-car'],
		},
		{
			stageId: 'asteroid-redoubt',
			legacyQuestId: 'tools-not-heroes',
			mainQuestId: 'asteroid-redoubt:main-last-lock-is-authorship',
			sideQuestId: 'asteroid-redoubt:side-tools-not-heroes',
			flags: ['asteroid-redoubt:commons-transmitter', 'asteroid-redoubt:public-toolkits-distributed'],
		},
	] as const)('reconciles $stageId through the persistent late-act quest model', (fixture) => {
		const world = new WorldDirector();
		const report = new RuntimeQuestBridge(world).apply({
			stageId: fixture.stageId,
			completedQuestIds: [fixture.legacyQuestId],
			completedMinigameIds: [`${fixture.stageId}:proof`],
			completedTutorialIds: [],
		});

		expect(report.questResults).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ questId: fixture.mainQuestId, questCompleted: true }),
				expect.objectContaining({ questId: fixture.sideQuestId, questCompleted: true }),
			])
		);
		expect(world.getState().worldFlags).toEqual(expect.arrayContaining([...fixture.flags]));
	});

	it('reconciles Mirror Palace into the public staff local and withdrawable archive', () => {
		const world = new WorldDirector();
		const report = new RuntimeQuestBridge(world).apply({
			stageId: 'mirror-palace',
			completedQuestIds: ['table-of-refusals'],
			completedMinigameIds: ['banquet-etiquette'],
			completedTutorialIds: [],
		});

		expect(report.questResults).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ questId: 'mirror-palace:main-banquet-of-air', questCompleted: true }),
				expect.objectContaining({ questId: 'mirror-palace:side-table-of-refusals', questCompleted: true }),
			])
		);
		expect(world.getState()).toMatchObject({
			locationStates: {
				'mirror-palace:station': { serviceLevels: { 'transit-control': 1 } },
				'mirror-palace:settlement': { serviceLevels: { archive: 1 } },
			},
			npcStates: {
				'portia-drift': { currentLocationId: 'mirror-palace:station' },
				'orchid-debt': { currentLocationId: 'mirror-palace:station' },
			},
		});
		expect(world.getState().worldFlags).toEqual(
			expect.arrayContaining([
				'mirror-palace:public-staff-local',
				'mirror-palace:withdrawable-refusal-archive',
				'main:sky-mirror-broken',
			])
		);
	});

	it('reconciles Dub Colony into rotating authority and a bidirectional return line', () => {
		const world = new WorldDirector();
		const report = new RuntimeQuestBridge(world).apply({
			stageId: 'dub-colony',
			completedQuestIds: ['chorus-spare-parts', 'missing-vote-cards'],
			completedMinigameIds: ['bass-reactor-sync'],
			completedTutorialIds: [],
		});

		expect(report.questResults).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ questId: 'dub-colony:main-master-fader', questCompleted: true }),
				expect.objectContaining({ questId: 'dub-colony:side-greenhouse-night-line', questCompleted: true }),
			])
		);
		expect(report.unmappedQuestIds).toContain('missing-vote-cards');
		expect(world.getState()).toMatchObject({
			locationStates: {
				'dub-colony:settlement': { serviceLevels: { greenhouse: 1 } },
				'dub-colony:station': { serviceLevels: { 'transit-control': 1 } },
			},
			npcStates: {
				'naya-root': { currentLocationId: 'dub-colony:station' },
				'juno-jar': { currentLocationId: 'dub-colony:station' },
				'coco-loop': { currentLocationId: 'dub-colony:station' },
			},
		});
		expect(world.getState().worldFlags).toEqual(
			expect.arrayContaining([
				'dub-colony:commons-governance',
				'dub-colony:return-coupler-ready',
				'homecoming:greenhouse-line-ready',
			])
		);
	});

	it('preserves unmapped legacy facts without inventing a quest mapping', () => {
		const world = new WorldDirector();
		const report = new RuntimeQuestBridge(world).apply({
			stageId: 'lower-sprawl',
			completedQuestIds: ['meter-maidens-ledger'],
			completedMinigameIds: [],
			completedTutorialIds: [],
		});

		expect(report.unmappedQuestIds).toEqual(['meter-maidens-ledger']);
		expect(world.getState().worldFlags).toContain(
			'runtime-quest:lower-sprawl:meter-maidens-ledger'
		);
	});

	it('reconciles the Arcology stage into the worker-authored Elevator Seed charter', () => {
		const world = new WorldDirector();
		const report = new RuntimeQuestBridge(world).apply({
			stageId: 'chrome-arcology',
			completedQuestIds: ['cargo-name-tags'],
			completedMinigameIds: ['elevator-seed-router'],
			completedTutorialIds: [],
		});

		expect(report.questResults[0]).toMatchObject({
			questId: 'chrome-arcology:main-elevator-seed',
			questCompleted: true,
		});
		expect(world.getState()).toMatchObject({
			questStates: {
				'chrome-arcology:main-elevator-seed': { status: 'completed' },
			},
			locationStates: {
				'chrome-arcology:settlement': {
					serviceLevels: { 'legal-aid': 1, 'field-shop': 1 },
				},
				'chrome-arcology:station': {
					serviceLevels: { 'transit-control': 1 },
				},
			},
			npcStates: {
				'rook-null': { currentLocationId: 'chrome-arcology:station' },
				'brother-pallet': { currentLocationId: 'chrome-arcology:station' },
			},
		});
		expect(world.getState().worldFlags).toEqual(
			expect.arrayContaining([
				'chrome-arcology:vertical-commons',
				'main:elevator-seed-secured',
				'runtime-minigame:chrome-arcology:elevator-seed-router',
			])
		);
	});
});
