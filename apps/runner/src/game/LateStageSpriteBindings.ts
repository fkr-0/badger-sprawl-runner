export type LateStoryStageId = 'antenna-barrens' | 'orbital-lift' | 'asteroid-redoubt';

const ENEMY_SHEETS: Record<LateStoryStageId, readonly [string, string, string]> = {
	'antenna-barrens': ['enemy_error_mite', 'enemy_manifest_monk', 'enemy_debt_wraith'],
	'orbital-lift': ['enemy_customs_lancer', 'enemy_contract_servitor', 'enemy_vane_air_bailiff'],
	'asteroid-redoubt': [
		'enemy_command_lock_partisan',
		'enemy_vane_air_bailiff',
		'enemy_command_lock_partisan',
	],
};

const BOSS_SHEETS: Readonly<Record<string, string>> = {
	'black-ice-fox': 'boss_boss_black_ice_fox_node',
	'elevator-angel': 'boss_boss_elevator_angel_counterweight',
	'director-vane': 'boss_boss_director_vane_skylock',
};

export function isLateStoryStage(stageId: string): stageId is LateStoryStageId {
	return stageId in ENEMY_SHEETS;
}

export function getLateStageEnemySpriteSheet(stageId: string, index: number): string | undefined {
	if (!isLateStoryStage(stageId)) return undefined;
	const sheets = ENEMY_SHEETS[stageId];
	return sheets[index % sheets.length];
}

export function getStoryBossSpriteSheet(bossId: string): string | undefined {
	return BOSS_SHEETS[bossId];
}

export function getStoryChoiceFigureSheet(stageId: string): string | undefined {
	return stageId === 'asteroid-redoubt' ? 'character_command_lock_faction' : undefined;
}
