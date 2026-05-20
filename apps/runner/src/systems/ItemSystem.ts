/**
 * Item system: active/passive items, cooldowns
 */

import type { ActionMap } from './InputSystem';
import type { Entity } from './PhysicsSystem';

export type PickupVisualState = 'available' | 'magnetized' | 'collecting' | 'collected' | 'respawn_pending';
export type PickupPersistence = 'ephemeral' | 'story_payload' | 'saved_once';

export interface Pickup {
	id: string;
	itemId?: string;
	x: number;
	y: number;
	kind: string;
	taken: boolean;
	radius?: number;
	visualState?: PickupVisualState;
	animation?: string;
	persistence?: PickupPersistence;
	collectTimer?: number;
}

export interface ItemSystemEvents {
	onCollect?: (pickup: Pickup) => void;
}

export function isStoryPayloadPickup(pickup: Pickup): boolean {
	return pickup.persistence === 'story_payload' && Boolean(pickup.itemId);
}

export function applyPersistedPayloadPickups(
	pickups: Pickup[],
	acquiredPayloadIds: readonly string[]
): void {
	const acquired = new Set(acquiredPayloadIds);
	for (const pickup of pickups) {
		if (isStoryPayloadPickup(pickup) && pickup.itemId && acquired.has(pickup.itemId)) {
			pickup.taken = true;
			pickup.visualState = 'collected';
			pickup.collectTimer = 0;
		}
	}
}

export function getCollectedStoryPayloadIds(pickups: readonly Pickup[]): string[] {
	return Array.from(
		new Set(
			pickups
				.filter((pickup) => isStoryPayloadPickup(pickup) && pickup.itemId && pickup.taken)
				.map((pickup) => pickup.itemId as string)
		)
	);
}

const DEFAULT_PICKUP_RADIUS = 30;
const DEFAULT_PICKUP_CENTER_OFFSET = 14;
const COLLECT_ANIMATION_SECONDS = 0.18;

export class ItemSystem {
	constructor(private events: ItemSystemEvents = {}) {}

	step(player: Entity, action: ActionMap, pickups: Pickup[], dt: number): void {
		for (const pickup of pickups) {
			if (pickup.visualState === 'collecting') {
				pickup.collectTimer = Math.max(0, (pickup.collectTimer ?? COLLECT_ANIMATION_SECONDS) - dt);
				if (pickup.collectTimer === 0) {
					pickup.visualState = 'collected';
					pickup.taken = true;
				}
				continue;
			}

			if (pickup.taken || pickup.visualState === 'collected') continue;

			const radius = pickup.radius ?? DEFAULT_PICKUP_RADIUS;
			const dx = player.x + player.w / 2 - (pickup.x + DEFAULT_PICKUP_CENTER_OFFSET);
			const dy = player.y + player.h / 2 - (pickup.y + DEFAULT_PICKUP_CENTER_OFFSET);
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < radius) {
				pickup.visualState = 'collecting';
				pickup.collectTimer = COLLECT_ANIMATION_SECONDS;
				this.collect(player, pickup);
				this.events.onCollect?.(pickup);
			}
		}
	}

	private collect(player: Entity, pickup: Pickup): void {
		switch (pickup.kind) {
			case 'rocket':
				player.hasRocket = true;
				break;
			case 'railgun':
				player.hasRailgun = true;
				break;
			case 'katana':
				player.hasKatana = true;
				break;
			case 'stim':
				player.stims++;
				break;
		}
	}
}
