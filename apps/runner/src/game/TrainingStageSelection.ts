import { RUNTIME_STAGE_IDS, type RuntimeStageId } from '../world/stageLayoutRegistry';

export interface TrainingStageSelection {
	seed: string;
	stageId: RuntimeStageId;
	stageIndex: number;
}

function hashSeed(seed: string): number {
	let hash = 0x811c9dc5;
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

export function createTrainingStageSeed(): string {
	const random = new Uint32Array(2);
	globalThis.crypto?.getRandomValues?.(random);
	const entropy =
		random[0] || random[1] ? `${random[0]}-${random[1]}` : `${Date.now()}-${performance.now()}`;
	return `dummy-training:${entropy}`;
}

export function selectTrainingStage(
	seed: string,
	previousStageId?: RuntimeStageId
): TrainingStageSelection {
	const initialIndex = hashSeed(seed) % RUNTIME_STAGE_IDS.length;
	const stageIndex =
		previousStageId && RUNTIME_STAGE_IDS[initialIndex] === previousStageId
			? (initialIndex + 1) % RUNTIME_STAGE_IDS.length
			: initialIndex;
	return {
		seed,
		stageIndex,
		stageId: RUNTIME_STAGE_IDS[stageIndex] ?? 'lower-sprawl',
	};
}
