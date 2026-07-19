import { describe, expect, it } from 'vitest';
import {
	getLateStageEnemySpriteSheet,
	getStoryBossSpriteSheet,
	getStoryChoiceFigureSheet,
} from './LateStageSpriteBindings';

describe('late story sprite bindings', () => {
	it('assigns authored enemy art to every unfinished campaign stage', () => {
		expect([0, 1, 2].map((index) => getLateStageEnemySpriteSheet('antenna-barrens', index))).toEqual([
			'enemy_error_mite',
			'enemy_manifest_monk',
			'enemy_debt_wraith',
		]);
		expect([0, 1, 2].map((index) => getLateStageEnemySpriteSheet('orbital-lift', index))).toEqual([
			'enemy_customs_lancer',
			'enemy_contract_servitor',
			'enemy_vane_air_bailiff',
		]);
		expect([0, 1, 2].map((index) => getLateStageEnemySpriteSheet('asteroid-redoubt', index))).toEqual([
			'enemy_command_lock_partisan',
			'enemy_vane_air_bailiff',
			'enemy_command_lock_partisan',
		]);
	});

	it('binds the three late-story bosses to their atlas sheets', () => {
		expect(getStoryBossSpriteSheet('black-ice-fox')).toBe('boss_boss_black_ice_fox_node');
		expect(getStoryBossSpriteSheet('elevator-angel')).toBe(
			'boss_boss_elevator_angel_counterweight'
		);
		expect(getStoryBossSpriteSheet('director-vane')).toBe('boss_boss_director_vane_skylock');
	});

	it('uses the command-lock faction art in the final broadcast choice', () => {
		expect(getStoryChoiceFigureSheet('asteroid-redoubt')).toBe(
			'character_command_lock_faction'
		);
		expect(getStoryChoiceFigureSheet('mirror-palace')).toBeUndefined();
	});
});
