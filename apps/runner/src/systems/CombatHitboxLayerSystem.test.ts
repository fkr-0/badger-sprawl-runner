import { describe, expect, it } from 'vitest';
import { resolveLayeredHit } from './CombatHitboxLayerSystem';

const box = { x: 0, y: 0, w: 10, h: 10 };

describe('CombatHitboxLayerSystem', () => {
	it('low attack misses airborne target', () => {
		expect(resolveLayeredHit({ moveId: 'sweep', hitboxes: { low: box } }, { entityId: 'drone', hurtboxes: { air: box } }).result).toBe('miss');
	});

	it('air attack hits airborne target', () => {
		expect(resolveLayeredHit({ moveId: 'anti_air', hitboxes: { air: box } }, { entityId: 'drone', hurtboxes: { air: box } })).toMatchObject({ result: 'hit', layer: 'air' });
	});

	it('parryable projectile respects projectile layer', () => {
		expect(resolveLayeredHit({ moveId: 'bolt', hitboxes: { projectile: box }, parryable: true }, { entityId: 'badger', hurtboxes: { projectile: box }, parryLayers: ['projectile'] })).toMatchObject({ result: 'parried', layer: 'projectile' });
	});

	it('unblockable bypasses guard but not invulnerability', () => {
		expect(resolveLayeredHit({ moveId: 'grab', hitboxes: { unblockable: box } }, { entityId: 'guard', hurtboxes: { unblockable: box }, guardLayers: ['unblockable'] }).result).toBe('hit');
		expect(resolveLayeredHit({ moveId: 'grab', hitboxes: { unblockable: box } }, { entityId: 'ghost', hurtboxes: { unblockable: box }, invulnerable: true }).result).toBe('invulnerable');
	});
});
