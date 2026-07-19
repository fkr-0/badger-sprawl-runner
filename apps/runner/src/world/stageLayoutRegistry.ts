import { cloneChromeArcologyLayout } from './chromeArcologyLayout';
import { cloneDrainmarketLayout } from './drainmarketLayout';
import { cloneDubColonyLayout } from './dubColonyLayout';
import { type StageLayout, cloneLowerSprawlLayout } from './lowerSprawlLayout';
import { cloneMirrorPalaceLayout } from './mirrorPalaceLayout';

export const RUNTIME_STAGE_IDS = [
	'lower-sprawl',
	'drainmarket',
	'chrome-arcology',
	'mirror-palace',
	'dub-colony',
	'antenna-barrens',
	'orbital-lift',
	'asteroid-redoubt',
] as const;

export type RuntimeStageId = (typeof RUNTIME_STAGE_IDS)[number];

interface RuntimeStageLayoutTheme {
	payloadId: string;
	payloadAnimation: string;
	enemyHpBonus: number;
	accentOffset: number;
}

const STAGE_LAYOUT_THEMES: Record<RuntimeStageId, RuntimeStageLayoutTheme> = {
	'lower-sprawl': {
		payloadId: 'wafer_key',
		payloadAnimation: 'wafer_key_pickup',
		enemyHpBonus: 0,
		accentOffset: 0,
	},
	drainmarket: {
		payloadId: 'stim_cache',
		payloadAnimation: 'stim_cache_pickup',
		enemyHpBonus: 0,
		accentOffset: 22,
	},
	'chrome-arcology': {
		payloadId: 'elevator_seed',
		payloadAnimation: 'elevator_seed_pickup',
		enemyHpBonus: 1,
		accentOffset: 44,
	},
	'mirror-palace': {
		payloadId: 'mirror_pass',
		payloadAnimation: 'mirror_pass_pickup',
		enemyHpBonus: 1,
		accentOffset: 66,
	},
	'dub-colony': {
		payloadId: 'bass_reactor_core',
		payloadAnimation: 'bass_reactor_core_pickup',
		enemyHpBonus: 1,
		accentOffset: 88,
	},
	'antenna-barrens': {
		payloadId: 'debt_ledger_shard',
		payloadAnimation: 'debt_ledger_shard_pickup',
		enemyHpBonus: 2,
		accentOffset: 110,
	},
	'orbital-lift': {
		payloadId: 'cargo_reversal_key',
		payloadAnimation: 'cargo_reversal_key_pickup',
		enemyHpBonus: 2,
		accentOffset: 132,
	},
	'asteroid-redoubt': {
		payloadId: 'asteroid_transmitter_root',
		payloadAnimation: 'asteroid_transmitter_root_pickup',
		enemyHpBonus: 3,
		accentOffset: 154,
	},
};

export function isRuntimeStageId(stageId: string): stageId is RuntimeStageId {
	return (RUNTIME_STAGE_IDS as readonly string[]).includes(stageId);
}

export function cloneStageLayout(stageId = 'lower-sprawl'): StageLayout {
	const runtimeStageId = isRuntimeStageId(stageId) ? stageId : 'lower-sprawl';
	if (runtimeStageId === 'drainmarket') return cloneDrainmarketLayout();
	if (runtimeStageId === 'chrome-arcology') return cloneChromeArcologyLayout();
	if (runtimeStageId === 'mirror-palace') return cloneMirrorPalaceLayout();
	if (runtimeStageId === 'dub-colony') return cloneDubColonyLayout();
	const theme = STAGE_LAYOUT_THEMES[runtimeStageId];
	const layout = cloneLowerSprawlLayout();
	return {
		id: `${runtimeStageId}-runtime`,
		platforms: layout.platforms.map((platform, index) => ({
			...platform,
			x: index === 0 ? platform.x : platform.x + (theme.accentOffset % 38),
		})),
		pickups: layout.pickups.map((pickup) => {
			if (pickup.persistence !== 'story_payload') return { ...pickup };
			return {
				...pickup,
				id: `${runtimeStageId}_${theme.payloadId}_payload`,
				itemId: theme.payloadId,
				animation: theme.payloadAnimation,
				x: pickup.x + theme.accentOffset,
			};
		}),
		enemies: layout.enemies.map((enemy, index) => ({
			...enemy,
			x: enemy.x + theme.accentOffset + index * 16,
			hp: enemy.hp + theme.enemyHpBonus,
			maxHp: enemy.maxHp + theme.enemyHpBonus,
		})),
	};
}
