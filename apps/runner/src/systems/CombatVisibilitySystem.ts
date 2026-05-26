import { hasLineOfSight, raycast, type RaycastObstacle } from '@badger/platformer-core';
import type { CombatEntity } from './CombatSystem';

export interface VisibilityResult {
	visibleIds: string[];
	blockedIds: string[];
	blockersByTarget: Record<string, string>;
}

function center(entity: Pick<CombatEntity, 'x' | 'y' | 'w' | 'h'>): { x: number; y: number } {
	return { x: entity.x + entity.w / 2, y: entity.y + entity.h / 2 };
}

export function computeCombatVisibility(
	origin: Pick<CombatEntity, 'id' | 'x' | 'y' | 'w' | 'h'>,
	targets: readonly CombatEntity[],
	obstacles: readonly RaycastObstacle[],
	maxDistance: number
): VisibilityResult {
	const from = center(origin);
	const visibleIds: string[] = [];
	const blockedIds: string[] = [];
	const blockersByTarget: Record<string, string> = {};

	for (const target of [...targets].sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''))) {
		if (!target.id || target.id === origin.id || target.hp <= 0) continue;
		const to = center(target);
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const distance = Math.hypot(dx, dy);
		if (distance > maxDistance) {
			blockedIds.push(target.id);
			blockersByTarget[target.id] = 'range';
			continue;
		}
		const hit = raycast({ x: from.x, y: from.y, dx, dy, maxDistance: distance, obstacles });
		if (!hit || hasLineOfSight({ x: from.x, y: from.y, dx, dy, maxDistance: distance, obstacles })) visibleIds.push(target.id);
		else {
			blockedIds.push(target.id);
			blockersByTarget[target.id] = hit.obstacle.id;
		}
	}

	return { visibleIds, blockedIds, blockersByTarget };
}
