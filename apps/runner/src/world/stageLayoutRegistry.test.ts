import { describe, expect, it } from 'vitest';
import { cloneStageLayout, RUNTIME_STAGE_IDS } from './stageLayoutRegistry';

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
