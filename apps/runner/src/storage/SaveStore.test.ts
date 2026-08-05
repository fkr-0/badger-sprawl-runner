import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import {
	ACTIVE_EXPEDITION_SAVE_KEY,
	LEGACY_SAVE_KEY,
	SAVE_KEY,
	clearActiveUndercityExpedition,
	createMemorySaveDriver,
	loadActiveUndercityExpedition,
	loadGameFlow,
	loadGameSession,
	saveActiveUndercityExpedition,
	saveGameFlow,
} from './SaveStore';
import {
	buildUndercityExpedition,
	createActiveUndercityExpeditionSave,
} from '../procgen/UndercityExpedition';

describe('save store', () => {
	it('persists active undercity state separately from canonical world truth', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow({ blueprintShards: 3 });
		saveGameFlow(driver, flow);
		const built = buildUndercityExpedition({
			seed: 'separate-save',
			entranceId: 'blue-mercy-maintenance-mouth',
			depth: 4,
		});
		const active = {
			...createActiveUndercityExpeditionSave(built.manifest),
			currentRoomIndex: 1,
			bankedSalvage: 8,
			unbankedSalvage: 3,
			updatedSequence: 2,
		};

		saveActiveUndercityExpedition(driver, active);
		expect(loadActiveUndercityExpedition(driver)).toEqual(active);
		expect(loadGameFlow(driver).getMeta().blueprintShards).toBe(3);
		const canonicalRaw = driver.getItem(SAVE_KEY) ?? '';
		expect(canonicalRaw).not.toContain('active-undercity');
		expect(canonicalRaw).not.toContain(built.manifest.runId);

		clearActiveUndercityExpedition(driver);
		expect(driver.getItem(ACTIVE_EXPEDITION_SAVE_KEY)).toBe('');
		expect(loadActiveUndercityExpedition(driver)).toBeNull();
	});

	it('round-trips game meta through a storage driver', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow({ blueprintShards: 1 });

		expect(flow.purchaseSkill('double_swipe').ok).toBe(true);
		saveGameFlow(driver, flow);

		const loaded = loadGameFlow(driver);
		expect(loaded.getMeta()).toMatchObject({
			blueprintShards: 0,
			purchasedSkills: ['double_swipe'],
		});
	});

	it('round-trips bounded build telemetry history for the comparison lab', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow({
			buildTelemetryHistory: [
				{
					runId: 'run:lower-sprawl:save:1',
					stageId: 'lower-sprawl',
					durationSeconds: 99.5,
					loadoutItemIds: ['claws', 'nanofur_weave'],
					skillRanks: { clawline: 2 },
					approaches: ['claw', 'social'],
					damageDealt: 14,
					damageTaken: 3,
					kills: 2,
					alarmsTriggered: 1,
					alarmsSpoofed: 0,
					alarmsDisabled: 1,
					civiliansDocumenting: 1,
					civiliansEvacuated: 0,
					civiliansSheltered: 1,
					standDownAppeals: 1,
					salvageBanked: 6,
					salvageLost: 0,
					deaths: 0,
				},
			],
		});

		saveGameFlow(driver, flow);
		const loaded = loadGameFlow(driver);
		expect(loaded.getBuildTelemetryHistory('lower-sprawl')).toEqual([
			expect.objectContaining({
				runId: 'run:lower-sprawl:save:1',
				loadoutItemIds: ['claws', 'nanofur_weave'],
				approaches: ['claw', 'social'],
			}),
		]);
	});

	it('round-trips story progress through a storage driver', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow();

		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		while (flow.getState().mode === 'dialogue') flow.advanceDialogue();
		flow.completeStage();
		while (flow.getState().mode === 'debrief') flow.advanceDebrief();
		saveGameFlow(driver, flow);

		const loaded = loadGameFlow(driver);
		expect(loaded.getStoryProgress()).toMatchObject({
			currentStageId: 'drainmarket',
			completedStageIds: ['lower-sprawl'],
			acquiredPayloads: ['wafer_key'],
		});
	});

	it('persists the Lio trust branch through save/load', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow(undefined, { currentStageId: 'mirror-palace' });

		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		while (flow.getState().mode === 'dialogue') flow.advanceDialogue();
		flow.chooseStageChoice(2);
		saveGameFlow(driver, flow);

		const loaded = loadGameFlow(driver);
		expect(loaded.getStoryProgress()).toMatchObject({
			currentStageId: 'mirror-palace',
			lioTrust: 'baited',
			resultFlags: ['lio_baited'],
		});
	});

	it('persists the colony alignment branch through save/load', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow(undefined, { currentStageId: 'dub-colony' });

		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		while (flow.getState().mode === 'dialogue') flow.advanceDialogue();
		flow.chooseStageChoice(2);
		saveGameFlow(driver, flow);

		const loaded = loadGameFlow(driver);
		expect(loaded.getStoryProgress()).toMatchObject({
			currentStageId: 'dub-colony',
			colonyAlignment: 'supplier',
			resultFlags: ['colony_alignment_supplier'],
		});
	});

	it('persists final broadcast doctrine and campaign completion', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow(undefined, {
			currentStageId: 'asteroid-redoubt',
			campaignComplete: true,
			finalBroadcastDoctrine: 'abolish-skylock',
			resultFlags: ['broadcast_abolish_skylock'],
		});

		saveGameFlow(driver, flow);
		const loaded = loadGameFlow(driver);

		expect(loaded.getStoryProgress()).toMatchObject({
			currentStageId: 'asteroid-redoubt',
			campaignComplete: true,
			finalBroadcastDoctrine: 'abolish-skylock',
			resultFlags: ['broadcast_abolish_skylock'],
		});
	});

	it('falls back to a new flow when stored data is corrupt', () => {
		const driver = createMemorySaveDriver();
		driver.setItem(SAVE_KEY, '{not-json');

		const loaded = loadGameFlow(driver);

		expect(loaded.getMeta()).toMatchObject({ blueprintShards: 0, purchasedSkills: [] });
	});
});

it('migrates legacy stage progress into persistent district state', () => {
	const driver = createMemorySaveDriver({
		[LEGACY_SAVE_KEY]: JSON.stringify({
			version: 1,
			meta: {},
			storyProgress: {
				currentStageId: 'chrome-arcology',
				completedStageIds: ['lower-sprawl', 'drainmarket'],
			},
		}),
	});

	const session = loadGameSession(driver);
	expect(session.adventure.districtPhases).toMatchObject({
		'lower-sprawl': 'transformed',
		drainmarket: 'transformed',
		'chrome-arcology': 'contested',
	});
	expect(session.adventure.discoveredLocationIds).toContain('chrome-arcology:route');
});

it('round-trips place, NPC, service, advancement, quest, and inventory state in v2', () => {
	const driver = createMemorySaveDriver();
	const flow = createGameFlow();
	const defaultAdventure = loadGameSession(createMemorySaveDriver()).adventure;
	saveGameFlow(driver, flow, {
		...defaultAdventure,
		currentLocationId: 'lower-sprawl:settlement',
		currentSpawnId: 'respawn',
		questStates: { 'lower-sprawl:main': { status: 'active', stepId: 'find-toll-ledger' } },
		npcStates: {
			'murr-murrby': {
				met: true,
				trust: 3,
				conversationIds: ['murr:survival-retail'],
				flags: ['murr-opened-ledger'],
				currentLocationId: 'lower-sprawl:station',
			},
		},
		advancement: {
			...defaultAdventure.advancement,
			experience: 225,
			level: 99,
			mastery: { ...defaultAdventure.advancement.mastery, hacking: 3, social: 2 },
			claimedRewardIds: ['resolution:lower-sprawl:captain-grin'],
		},
		locationStates: {
			'lower-sprawl:settlement': {
				visitCount: 4,
				flags: ['market-night-open'],
				serviceLevels: { 'field-shop': 1 },
				serviceStrain: { clinic: 2 },
			},
		},
		advancement: {
			experience: 225,
			level: 3,
			mastery: { hacking: 3, social: 2 },
			claimedRewardIds: ['resolution:lower-sprawl:captain-grin'],
		},
		inventory: [{ itemId: 'signal_jammer', quantity: 1 }],
		equippedItemIds: ['signal_jammer'],
		itemStates: {
			signal_jammer: {
				condition: 64,
				maxCondition: 100,
				modificationId: 'subharmonic-tuning',
				repairCount: 2,
			},
		},
		expedition: {
			integrity: 4,
			maxIntegrity: 7,
			injuries: 1,
			completedRuns: 3,
			lastStageId: 'drainmarket',
		},
		economy: {
			spentCredchips: 210,
			serviceSpend: 165,
			purchaseCount: 2,
			repairCount: 1,
			clinicVisits: 1,
			rewardItemCount: 2,
			journal: [],
		},
	});

	const session = loadGameSession(driver);
	expect(session.adventure).toMatchObject({
		schemaVersion: 2,
		currentLocationId: 'lower-sprawl:settlement',
		currentSpawnId: 'respawn',
		questStates: { 'lower-sprawl:main': { status: 'active', stepId: 'find-toll-ledger' } },
		npcStates: {
			'murr-murrby': {
				met: true,
				trust: 3,
				currentLocationId: 'lower-sprawl:station',
			},
		},
		locationStates: {
			'lower-sprawl:settlement': {
				visitCount: 4,
				flags: ['market-night-open'],
				serviceLevels: { 'field-shop': 1 },
				serviceStrain: { clinic: 2 },
			},
		},
		inventory: [{ itemId: 'signal_jammer', quantity: 1 }],
		equippedItemIds: ['signal_jammer'],
		itemStates: {
			signal_jammer: {
				condition: 64,
				modificationId: 'subharmonic-tuning',
				repairCount: 2,
			},
		},
		expedition: {
			integrity: 4,
			maxIntegrity: 7,
			injuries: 1,
			completedRuns: 3,
			lastStageId: 'drainmarket',
		},
		economy: {
			spentCredchips: 210,
			serviceSpend: 165,
			clinicVisits: 1,
		},
	});
});

it('migrates legacy v1 story progress through save load', () => {
	const driver = createMemorySaveDriver({
		[LEGACY_SAVE_KEY]: JSON.stringify({
			version: 1,
			meta: { blueprintShards: 2 },
			storyProgress: {
				currentStageId: 'asteroid-redoubt',
				completedStageIds: ['lower-sprawl', 'lower-sprawl'],
				completedChapterIds: ['ch01'],
				acquiredPayloads: ['wafer_key'],
				resultFlags: ['lio_protected', 'colony_alignment_supplier', 'broadcast_publish_tools'],
			},
		}),
	});

	const loaded = loadGameFlow(driver);
	expect(loaded.getStoryProgress()).toMatchObject({
		schemaVersion: 2,
		currentStageId: 'asteroid-redoubt',
		completedStageIds: ['lower-sprawl'],
		lioTrust: 'protected',
		colonyAlignment: 'supplier',
		finalBroadcastDoctrine: 'publish-tools',
	});
});
