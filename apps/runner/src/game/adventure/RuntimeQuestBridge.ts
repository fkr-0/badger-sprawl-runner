import type { StageRuntimeResult } from '../GameFlow';
import { QuestDirector, type QuestProgressResult } from './QuestDirector';
import type { WorldCommandResult, WorldDirector } from './WorldDirector';

interface LegacyQuestMapping {
	questId: string;
	consequenceId?: string;
}

const LOCAL_STAGE_QUESTS: Partial<Record<string, LegacyQuestMapping>> = {
	'lower-sprawl': { questId: 'lower-sprawl:main-song-of-the-toll' },
	drainmarket: { questId: 'drainmarket:main-knife-weather' },
	'chrome-arcology': { questId: 'chrome-arcology:main-elevator-seed' },
	'mirror-palace': {
		questId: 'mirror-palace:main-banquet-of-air',
		consequenceId: 'public-staff-local',
	},
	'dub-colony': {
		questId: 'dub-colony:main-master-fader',
		consequenceId: 'rotating-colony-commons',
	},
	'antenna-barrens': {
		questId: 'antenna-barrens:main-forecast-is-not-permission',
		consequenceId: 'contestable-public-forecast',
	},
	'orbital-lift': {
		questId: 'orbital-lift:main-cargo-declares-itself-passengers',
		consequenceId: 'passenger-authored-homecoming',
	},
	'asteroid-redoubt': {
		questId: 'asteroid-redoubt:main-last-lock-is-authorship',
		consequenceId: 'commons-transmitter-ready',
	},
};

const LEGACY_RUNTIME_QUESTS: Record<string, LegacyQuestMapping> = {
	'clinic-without-cameras': {
		questId: 'drainmarket:side-clinic-without-cameras',
		consequenceId: 'redundant-cold-chain',
	},
	'table-of-refusals': {
		questId: 'mirror-palace:side-table-of-refusals',
		consequenceId: 'withdrawable-archive',
	},
	'chorus-spare-parts': {
		questId: 'dub-colony:side-greenhouse-night-line',
		consequenceId: 'bidirectional-return-line',
	},
	'pirate-signal-cache': {
		questId: 'antenna-barrens:side-pirate-signal-cache',
		consequenceId: 'consent-aware-listener-archive',
	},
	'cargo-reversal-witnesses': {
		questId: 'orbital-lift:side-cargo-reversal-witnesses',
		consequenceId: 'protected-witness-car',
	},
	'tools-not-heroes': {
		questId: 'asteroid-redoubt:side-tools-not-heroes',
		consequenceId: 'distributed-public-toolkits',
	},
};

export interface RuntimeQuestBridgeReport {
	stageId: string;
	questResults: QuestProgressResult[];
	worldResults: WorldCommandResult[];
	unmappedQuestIds: string[];
	unmappedMinigameIds: string[];
}

/**
 * Anti-corruption layer between the original stage-completion vocabulary and
 * the persistent adventure quest model. It keeps old objectives playable
 * while new content migrates toward semantic, incremental quest events.
 */
export class RuntimeQuestBridge {
	private readonly quests: QuestDirector;

	constructor(private readonly world: WorldDirector) {
		this.quests = new QuestDirector(world);
	}

	apply(result: StageRuntimeResult): RuntimeQuestBridgeReport {
		const questResults: QuestProgressResult[] = [];
		const worldResults: WorldCommandResult[] = [];
		const unmappedQuestIds: string[] = [];
		const unmappedMinigameIds: string[] = [];
		const local = LOCAL_STAGE_QUESTS[result.stageId];
		if (local) {
			questResults.push(
				this.quests.reconcileQuestCompletion(local.questId, local.consequenceId)
			);
		}

		for (const legacyQuestId of result.completedQuestIds) {
			const mapping = LEGACY_RUNTIME_QUESTS[legacyQuestId];
			if (mapping) {
				questResults.push(
					this.quests.reconcileQuestCompletion(mapping.questId, mapping.consequenceId)
				);
			} else {
				unmappedQuestIds.push(legacyQuestId);
			}
			worldResults.push(
				this.world.execute({
					type: 'set-world-flag',
					flag: `runtime-quest:${result.stageId}:${legacyQuestId}`,
				})
			);
		}

		for (const minigameId of result.completedMinigameIds) {
			unmappedMinigameIds.push(minigameId);
			worldResults.push(
				this.world.execute({
					type: 'set-world-flag',
					flag: `runtime-minigame:${result.stageId}:${minigameId}`,
				})
			);
		}

		return {
			stageId: result.stageId,
			questResults,
			worldResults,
			unmappedQuestIds,
			unmappedMinigameIds,
		};
	}
}
