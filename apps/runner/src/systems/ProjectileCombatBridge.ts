import type { ProjectileHit } from '@badger/platformer-core';
import { CombatSystem, type CombatEntity, type CombatEvents } from './CombatSystem';
import type { StatusEffect } from './StatusEffectSystem';

export interface ProjectileCombatBridgeInput {
	attacker: CombatEntity;
	targets: CombatEntity[];
	hits: readonly ProjectileHit[];
	statusByProjectileKind?: Partial<Record<ProjectileHit['kind'], StatusEffect[]>>;
	time: number;
	events?: CombatEvents;
}

export interface ProjectileCombatBridgeResult {
	resolved: number;
	kills: number;
	missingTargets: string[];
}

function projectileHitbox(target: CombatEntity) {
	return { x: target.x, y: target.y, w: target.w, h: target.h };
}

export function resolveProjectileHitsAsCombat(input: ProjectileCombatBridgeInput): ProjectileCombatBridgeResult {
	const combat = new CombatSystem();
	let resolved = 0;
	let kills = 0;
	const missingTargets: string[] = [];

	for (const hit of input.hits) {
		const target = input.targets.find((candidate) => candidate.id === hit.targetId);
		if (!target) {
			missingTargets.push(hit.targetId);
			continue;
		}

		const result = combat.resolveAttack(input.attacker, [target], {
			id: `projectile:${hit.projectileId}`,
			source: input.attacker.faction === 'enemy' ? 'enemy' : 'player',
			damage: hit.damage,
			stun: hit.kind === 'rail' ? 0.25 : hit.kind === 'rocket' ? 0.45 : 0.15,
			poiseDamage: hit.kind === 'rocket' ? hit.damage * 1.5 : hit.damage,
			knockbackX: hit.kind === 'rocket' ? 220 : hit.kind === 'rail' ? 80 : 40,
			knockbackY: hit.kind === 'rocket' ? -120 : 0,
			hitbox: projectileHitbox(target),
			comboGain: hit.kind === 'rail' ? 2 : 1,
			statusOnHit: input.statusByProjectileKind?.[hit.kind] ?? [],
		}, input.events, input.time);

		resolved += result.hits.some((event) => event.kind === 'hit' || event.kind === 'kill') ? 1 : 0;
		kills += result.kills;
	}

	return { resolved, kills, missingTargets };
}
