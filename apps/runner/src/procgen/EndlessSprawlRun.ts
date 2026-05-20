import type { StageRunSceneOptions } from '../scenes/StageRunScene';
import { EncounterGenerator } from './EncounterGenerator';
import { SideRoomGenerator } from './SideRoomGenerator';

export interface EndlessSprawlRunInput {
	seed?: string;
	floor?: number;
}

export interface EndlessSprawlRunSummary {
	seed: string;
	floor: number;
	stageId: NonNullable<StageRunSceneOptions['stageId']>;
	enemyPackCount: number;
	sideRoomCount: number;
	budgetHint: number;
}

const ENDLESS_STAGE_ROTATION: NonNullable<StageRunSceneOptions['stageId']>[] = [
	'lower-sprawl',
	'drainmarket',
	'chrome-arcology',
	'mirror-palace',
	'dub-colony',
	'antenna-barrens',
	'orbital-lift',
	'asteroid-redoubt',
];

export function buildEndlessSprawlRun(input: EndlessSprawlRunInput = {}): {
	options: StageRunSceneOptions;
	summary: EndlessSprawlRunSummary;
} {
	const floor = Math.max(1, Math.floor(input.floor ?? 1));
	const seed = input.seed ?? 'endless-sprawl';
	const stageId = ENDLESS_STAGE_ROTATION[(floor - 1) % ENDLESS_STAGE_ROTATION.length] ?? 'lower-sprawl';
	const procgenSeed = `${seed}:floor:${floor}:${stageId}`;
	const enemyPackCount = Math.min(5, 1 + Math.floor(floor / 2));
	const sideRoomCount = Math.min(4, 1 + Math.floor(floor / 3));
	const orbitHeat = Math.min(12, floor + Math.floor(floor / 3));
	const gameplayHooks = floor >= 5 ? ['ambush_warning_overlay', 'companion_assist_delay'] : [];
	const encounters = new EncounterGenerator();
	const sideRooms = new SideRoomGenerator();

	const options: StageRunSceneOptions = {
		stageId,
		procgenSeed,
		branchGameplayHooks: gameplayHooks,
		generatedEnemyPacks: encounters.generatePacks(
			{ stageId, seed: procgenSeed, orbitHeat, gameplayHooks },
			enemyPackCount
		),
		generatedSideRooms: sideRooms.generateSideRooms({
			stageId,
			seed: procgenSeed,
			count: sideRoomCount,
			gameplayHooks,
		}),
	};

	return {
		options,
		summary: {
			seed,
			floor,
			stageId,
			enemyPackCount,
			sideRoomCount,
			budgetHint: orbitHeat,
		},
	};
}
