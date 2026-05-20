import type { CombatEntity } from '../systems/CombatSystem';
import type { Pickup } from '../systems/ItemSystem';
import type { Platform } from '../systems/PhysicsSystem';

export interface StageLayout {
	id: string;
	platforms: Platform[];
	pickups: Pickup[];
	enemies: CombatEntity[];
}

export const lowerSprawlLayout: StageLayout = {
	id: 'lower-sprawl-prototype',
	platforms: [
		{ x: 0, y: 494, w: 1900, h: 80 },
		{ x: 230, y: 415, w: 135, h: 18 },
		{ x: 455, y: 360, w: 130, h: 18 },
		{ x: 705, y: 405, w: 150, h: 18 },
		{ x: 950, y: 338, w: 170, h: 18 },
		{ x: 1230, y: 420, w: 160, h: 18 },
		{ x: 1480, y: 365, w: 240, h: 18 },
	],
	pickups: [
		{
			id: 'rocket_backpack',
			itemId: 'rocket_backpack',
			x: 270,
			y: 382,
			kind: 'rocket',
			radius: 30,
			taken: false,
			visualState: 'available',
			animation: 'rocket_backpack_pickup',
			persistence: 'saved_once',
		},
		{
			id: 'railgun',
			itemId: 'railgun',
			x: 500,
			y: 326,
			kind: 'railgun',
			radius: 30,
			taken: false,
			visualState: 'available',
			animation: 'railgun_pickup',
			persistence: 'saved_once',
		},
		{
			id: 'stim_pack',
			itemId: 'stim_pack',
			x: 996,
			y: 304,
			kind: 'stim',
			radius: 30,
			taken: false,
			visualState: 'available',
			animation: 'stim_pack_pickup',
			persistence: 'ephemeral',
		},
		{
			id: 'katana',
			itemId: 'katana',
			x: 1518,
			y: 330,
			kind: 'katana',
			radius: 30,
			taken: false,
			visualState: 'available',
			animation: 'katana_pickup',
			persistence: 'saved_once',
		},
	],
	enemies: [
		{
			x: 620,
			y: 462,
			w: 34,
			h: 32,
			vx: -42,
			vy: 0,
			dir: -1,
			onGround: true,
			coyoteLeft: 0,
			jumpBuffered: 0,
			hp: 2,
			maxHp: 2,
			stun: 0,
			invuln: 0,
		},
		{
			x: 1130,
			y: 305,
			w: 34,
			h: 30,
			vx: 0,
			vy: 0,
			dir: -1,
			onGround: true,
			coyoteLeft: 0,
			jumpBuffered: 0,
			hp: 2,
			maxHp: 2,
			stun: 0,
			invuln: 0,
		},
	],
};

export function cloneLowerSprawlLayout(): StageLayout {
	return {
		id: lowerSprawlLayout.id,
		platforms: lowerSprawlLayout.platforms.map((platform) => ({ ...platform })),
		pickups: lowerSprawlLayout.pickups.map((pickup) => ({ ...pickup })),
		enemies: lowerSprawlLayout.enemies.map((enemy) => ({ ...enemy })),
	};
}
