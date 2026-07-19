import type { Rect } from '@badger/platformer-core';
import { resolveHitboxContacts } from '../../../../vendor/arcade-runtime.mjs';

export type CombatHitboxLayer = 'high' | 'mid' | 'low' | 'air' | 'projectile' | 'unblockable';

export interface LayeredHurtboxProfile {
	entityId: string;
	hurtboxes: Partial<Record<CombatHitboxLayer, Rect>>;
	guardLayers?: CombatHitboxLayer[];
	parryLayers?: CombatHitboxLayer[];
	invulnerable?: boolean;
}

export interface LayeredAttackProfile {
	moveId: string;
	hitboxes: Partial<Record<CombatHitboxLayer, Rect>>;
	parryable?: boolean;
}

export interface LayeredHitResult {
	result: 'hit' | 'blocked' | 'parried' | 'miss' | 'invulnerable';
	moveId: string;
	entityId: string;
	layer: CombatHitboxLayer | null;
}

const LAYER_ORDER: CombatHitboxLayer[] = ['high', 'mid', 'low', 'air', 'projectile', 'unblockable'];

export function resolveLayeredHit(attack: LayeredAttackProfile, target: LayeredHurtboxProfile): LayeredHitResult {
	if (target.invulnerable) return { result: 'invulnerable', moveId: attack.moveId, entityId: target.entityId, layer: null };
	const guardLayers = new Set(target.guardLayers ?? []);
	const parryLayers = new Set(target.parryLayers ?? []);
	for (const layer of LAYER_ORDER) {
		const hitbox = attack.hitboxes[layer];
		const hurtbox = target.hurtboxes[layer];
		if (!hitbox || !hurtbox) continue;
		const contacts = resolveHitboxContacts({
			hitboxes: [
				{
					id: `${attack.moveId}:${layer}`,
					ownerId: `attacker:${attack.moveId}`,
					...hitbox,
				},
			],
			hurtboxes: [
				{
					id: `${target.entityId}:${layer}`,
					actorId: target.entityId,
					...hurtbox,
				},
			],
		});
		if (contacts.length === 0) continue;
		if (attack.parryable && parryLayers.has(layer)) return { result: 'parried', moveId: attack.moveId, entityId: target.entityId, layer };
		if (layer !== 'unblockable' && guardLayers.has(layer)) return { result: 'blocked', moveId: attack.moveId, entityId: target.entityId, layer };
		return { result: 'hit', moveId: attack.moveId, entityId: target.entityId, layer };
	}
	return { result: 'miss', moveId: attack.moveId, entityId: target.entityId, layer: null };
}
