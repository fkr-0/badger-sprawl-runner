import { describe, expect, it } from 'vitest';
import { RUNTIME_STAGE_IDS, cloneStageLayout } from './stageLayoutRegistry';

describe('stageLayoutRegistry', () => {
	it('clones a distinct runtime layout for every campaign stage id', () => {
		for (const stageId of RUNTIME_STAGE_IDS) {
			const layout = cloneStageLayout(stageId);
			expect(layout.id).toBe(`${stageId}-runtime`);
			expect(layout.platforms.length).toBeGreaterThan(0);
			expect(layout.pickups.some((pickup) => pickup.persistence === 'story_payload')).toBe(true);
			expect(layout.enemies.length).toBeGreaterThan(0);
		}
	});

	it('uses the authored Dub Colony beat route and production enemy families', () => {
		const layout = cloneStageLayout('dub-colony');
		expect(layout.id).toBe('dub-colony-runtime');
		expect(layout.pickups.some((pickup) => pickup.itemId === 'dub_shield')).toBe(true);
		expect(layout.pickups.some((pickup) => pickup.itemId === 'bass_reactor_core')).toBe(true);
		expect(layout.enemies.some((enemy) => enemy.procgenFamily === 'signal_jammer_bat')).toBe(true);
		expect(layout.enemies.some((enemy) => enemy.procgenFamily === 'feedback_guard')).toBe(true);
	});

	it('uses the authored Mirror Palace rocket route and story payload', () => {
		const layout = cloneStageLayout('mirror-palace');
		expect(layout.id).toBe('mirror-palace-runtime');
		expect(layout.pickups.some((pickup) => pickup.itemId === 'rocket_backpack')).toBe(true);
		expect(layout.pickups.some((pickup) => pickup.itemId === 'mirror_pass')).toBe(true);
		expect(layout.enemies.some((enemy) => enemy.procgenFamily === 'banquet_usher')).toBe(true);
		expect(layout.enemies.some((enemy) => enemy.procgenFamily === 'mirror_sentinel')).toBe(true);
	});

	it('uses the authored Chrome Arcology railgun layout and production enemy families', () => {
		const layout = cloneStageLayout('chrome-arcology');
		expect(layout.id).toBe('chrome-arcology-runtime');
		expect(layout.pickups.some((pickup) => pickup.itemId === 'elevator_seed')).toBe(true);
		expect(layout.pickups.some((pickup) => pickup.itemId === 'railgun')).toBe(true);
		expect(layout.enemies.some((enemy) => enemy.procgenFamily === 'chrome_bellhop')).toBe(true);
		expect(layout.enemies.some((enemy) => enemy.procgenFamily === 'mirror_sentinel')).toBe(true);
	});

	it('uses the authored Drainmarket combat layout instead of a shifted Lower Sprawl clone', () => {
		const layout = cloneStageLayout('drainmarket');
		expect(layout.id).toBe('drainmarket-runtime');
		expect(layout.pickups.some((pickup) => pickup.itemId === 'stim_cache')).toBe(true);
		expect(layout.enemies.some((enemy) => enemy.procgenFamily === 'knife_drone')).toBe(true);
	});

	it('places authored sprite rosters into the three unfinished late stages', () => {
		expect(cloneStageLayout('antenna-barrens').enemies.map((enemy) => enemy.spriteSheetId)).toEqual([
			'enemy_error_mite',
			'enemy_manifest_monk',
			'enemy_debt_wraith',
		]);
		expect(cloneStageLayout('orbital-lift').enemies.map((enemy) => enemy.spriteSheetId)).toEqual([
			'enemy_customs_lancer',
			'enemy_contract_servitor',
			'enemy_vane_air_bailiff',
		]);
		expect(cloneStageLayout('asteroid-redoubt').enemies.map((enemy) => enemy.spriteSheetId)).toEqual([
			'enemy_command_lock_partisan',
			'enemy_vane_air_bailiff',
			'enemy_command_lock_partisan',
		]);
	});

	it('maps story payload pickups to the requested stage payload', () => {
		const layout = cloneStageLayout('orbital-lift');
		const payload = layout.pickups.find((pickup) => pickup.persistence === 'story_payload');
		expect(payload).toMatchObject({
			id: 'orbital-lift_cargo_reversal_key_payload',
			itemId: 'cargo_reversal_key',
			animation: 'cargo_reversal_key_pickup',
		});
	});

	it('falls back to lower-sprawl for unknown stage ids', () => {
		const layout = cloneStageLayout('unknown-stage');
		expect(layout.id).toBe('lower-sprawl-runtime');
	});
});
