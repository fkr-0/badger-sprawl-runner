import { rollDropTable, type DropTable, type DroppedItem } from '../../systems/ItemDropSystem';

const STORY_REWARD_TABLES: Readonly<Record<string, DropTable>> = {
	'lower-sprawl': {
		id: 'story:lower-sprawl',
		guaranteed: [{ itemId: 'stim_pack', weight: 1, minQuantity: 1, maxQuantity: 1 }],
		entries: [
			{ itemId: 'signal_jammer', weight: 2, minQuantity: 1, maxQuantity: 1 },
			{ itemId: 'phase_pick', weight: 1, minQuantity: 1, maxQuantity: 1 },
		],
	},
	drainmarket: {
		id: 'story:drainmarket',
		guaranteed: [{ itemId: 'stim_pack', weight: 1, minQuantity: 1, maxQuantity: 2 }],
		entries: [
			{ itemId: 'nanofur_weave', weight: 3, minQuantity: 1, maxQuantity: 1 },
			{ itemId: 'ledger_lens', weight: 1, minQuantity: 1, maxQuantity: 1 },
		],
	},
	'chrome-arcology': {
		id: 'story:chrome-arcology',
		entries: [
			{ itemId: 'capacitor_coil', weight: 3, minQuantity: 1, maxQuantity: 1 },
			{ itemId: 'rootkit_badge', weight: 1, minQuantity: 1, maxQuantity: 1 },
		],
	},
	'mirror-palace': {
		id: 'story:mirror-palace',
		entries: [
			{ itemId: 'mirror_thread', weight: 2, minQuantity: 1, maxQuantity: 1 },
			{ itemId: 'phase_mantle', weight: 2, minQuantity: 1, maxQuantity: 1 },
		],
	},
	'dub-colony': {
		id: 'story:dub-colony',
		entries: [
			{ itemId: 'shock_fern', weight: 2, minQuantity: 1, maxQuantity: 1 },
			{ itemId: 'solder_mite_swarm', weight: 2, minQuantity: 1, maxQuantity: 1 },
		],
	},
	'antenna-barrens': {
		id: 'story:antenna-barrens',
		entries: [
			{ itemId: 'black_ice_tooth', weight: 2, minQuantity: 1, maxQuantity: 1 },
			{ itemId: 'echo_cassette', weight: 2, minQuantity: 1, maxQuantity: 1 },
		],
	},
	'orbital-lift': {
		id: 'story:orbital-lift',
		entries: [
			{ itemId: 'gravity_talisman', weight: 2, minQuantity: 1, maxQuantity: 1 },
			{ itemId: 'rail_heat_sink', weight: 2, minQuantity: 1, maxQuantity: 1 },
		],
	},
	'asteroid-redoubt': {
		id: 'story:asteroid-redoubt',
		guaranteed: [{ itemId: 'contraband_seed_key', weight: 1, minQuantity: 1, maxQuantity: 1 }],
		entries: [
			{ itemId: 'echo_spurs', weight: 2, minQuantity: 1, maxQuantity: 1 },
			{ itemId: 'dub_shield', weight: 2, minQuantity: 1, maxQuantity: 1 },
		],
	},
};

export function getCuratedStoryRewardTable(stageId: string): DropTable | undefined {
	const table = STORY_REWARD_TABLES[stageId];
	return table
		? {
				...table,
				entries: table.entries.map((entry) => ({ ...entry })),
				guaranteed: table.guaranteed?.map((entry) => ({ ...entry })),
			}
		: undefined;
}

export function rollCuratedStoryRewards(
	stageId: string,
	seed: string,
	sourceTags: readonly string[] = []
): DroppedItem[] {
	const table = STORY_REWARD_TABLES[stageId];
	if (!table) return [];
	return rollDropTable(
		table,
		{
			seed,
			runId: stageId,
			sourceId: `stage-complete:${stageId}`,
			sourceTags: [...sourceTags],
		},
		1
	);
}
