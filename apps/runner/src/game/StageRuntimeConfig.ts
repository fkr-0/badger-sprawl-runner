import type { StageSpec } from './GameFlow';

export type RuntimeCameraPressure = 'standard' | 'rhythm' | 'code-gate' | 'chase';

export interface RuntimeStageModifierRule {
	id: string;
	label: string;
	kind: string;
	effect: string;
}

export interface StageRuntimeConfig {
	stageId: string;
	templateId: string;
	templateKind: string;
	hazardIds: string[];
	hazardCount: number;
	enemyMixTags: string[];
	cameraPressure: RuntimeCameraPressure;
	payloadRewardId: string | null;
	bossPlaceholderId: string | null;
	modifierRules: RuntimeStageModifierRule[];
}

export function buildStageRuntimeConfig(stage: StageSpec | undefined): StageRuntimeConfig | undefined {
	if (!stage) return undefined;
	const modifierRules = (stage.stageModifiers ?? []).map((modifier) => ({
		id: modifier.id,
		label: modifier.label,
		kind: modifier.kind,
		effect: describeModifierEffect(modifier),
	}));
	const hazardIds = (stage.traversalHazards ?? []).map((hazard) => hazard.id);
	const templateId = stage.stageTemplate?.id ?? stage.id;
	const templateKind = stage.stageTemplate?.kind ?? 'standard-platforming';
	return {
		stageId: stage.id,
		templateId,
		templateKind,
		hazardIds,
		hazardCount: hazardIds.length,
		enemyMixTags: buildEnemyMixTags(stage, modifierRules, hazardIds),
		cameraPressure: selectCameraPressure(stage, modifierRules),
		payloadRewardId: stage.heistPayloadId ?? null,
		bossPlaceholderId: stage.boss?.id ?? null,
		modifierRules,
	};
}

type RuntimeStageModifierInput = NonNullable<StageSpec['stageModifiers']>[number];

function describeModifierEffect(modifier: RuntimeStageModifierInput): string {
	if (modifier.kind === 'beat-timing') {
		const bpm = 'bpm' in modifier && typeof modifier.bpm === 'number' ? modifier.bpm : 120;
		const windowMs =
			'perfectWindowMs' in modifier && typeof modifier.perfectWindowMs === 'number'
				? modifier.perfectWindowMs
				: 100;
		return `rhythm window ${windowMs}ms at ${bpm}bpm`;
	}
	if (modifier.kind === 'code-gate-pressure') {
		const gatesPerMinute =
			'gatesPerMinute' in modifier && typeof modifier.gatesPerMinute === 'number'
				? modifier.gatesPerMinute
				: 3;
		const minGates =
			'minGatesPerRun' in modifier && typeof modifier.minGatesPerRun === 'number'
				? modifier.minGatesPerRun
				: 1;
		return `spawn ${gatesPerMinute} code gates/min, minimum ${minGates}`;
	}
	return modifier.label;
}

function buildEnemyMixTags(
	stage: StageSpec,
	modifierRules: readonly RuntimeStageModifierRule[],
	hazardIds: readonly string[]
): string[] {
	return Array.from(
		new Set([
			stage.primaryVerb.replace(/\s+/g, '-'),
			...modifierRules.map((rule) => rule.kind),
			...hazardIds.map((id) => `hazard:${id}`),
			...(stage.stageTemplate ? [`template:${stage.stageTemplate.kind}`] : []),
		].filter(Boolean))
	);
}

function selectCameraPressure(
	stage: StageSpec,
	modifierRules: readonly RuntimeStageModifierRule[]
): RuntimeCameraPressure {
	if (stage.stageTemplate?.kind === 'escape-chase') return 'chase';
	if (modifierRules.some((rule) => rule.kind === 'code-gate-pressure')) return 'code-gate';
	if (modifierRules.some((rule) => rule.kind === 'beat-timing')) return 'rhythm';
	return 'standard';
}
