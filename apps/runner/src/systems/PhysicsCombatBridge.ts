import type { PhysicsMaterialEvent } from '@badger/platformer-core';
import { CombatSystem, type CombatEntity, type CombatEvents } from './CombatSystem';
import type { StatusEffect } from './StatusEffectSystem';

export interface PhysicsCombatBridgeInput {
	materialEvents: readonly PhysicsMaterialEvent[];
	combatants: CombatEntity[];
	time: number;
	events?: CombatEvents;
	statusByMaterialTag?: Partial<Record<string, StatusEffect[]>>;
}

export interface PhysicsCombatBridgeResult {
	resolvedDamage: number;
	missingActorIds: string[];
	statusApplications: number;
}

export function resolveMaterialEventsAsCombat(input: PhysicsCombatBridgeInput): PhysicsCombatBridgeResult {
	const combat = new CombatSystem();
	let resolvedDamage = 0;
	let statusApplications = 0;
	const missingActorIds: string[] = [];

	for (const materialEvent of input.materialEvents) {
		const target = input.combatants.find((combatant) => combatant.id === materialEvent.actorId);
		if (!target) {
			missingActorIds.push(materialEvent.actorId);
			continue;
		}

		const statuses = materialEvent.tags.flatMap((tag) => input.statusByMaterialTag?.[tag] ?? []);
		if (materialEvent.damage <= 0 && statuses.length === 0) continue;

		const result = combat.resolveAttack({ ...target, id: `material:${materialEvent.materialId}`, faction: 'enemy', dir: 0 }, [target], {
			id: `material:${materialEvent.materialId}`,
			source: 'enemy',
			damage: materialEvent.damage,
			stun: materialEvent.tags.includes('hazard') ? 0.08 : 0,
			knockbackX: 0,
			hitbox: { x: target.x, y: target.y, w: target.w, h: target.h },
			parryable: false,
			statusOnHit: statuses,
		}, input.events, input.time);

		resolvedDamage += result.hits.reduce((sum, event) => sum + (event.damage ?? 0), 0);
		statusApplications += statuses.length;
	}

	return { resolvedDamage, missingActorIds, statusApplications };
}
