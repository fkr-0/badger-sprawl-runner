import type { CombatEntity } from '../systems/CombatSystem';
import type { Pickup } from '../systems/ItemSystem';
import type { Platform } from '../systems/PhysicsSystem';
import type { StageLayout } from './lowerSprawlLayout';

const platforms: Platform[] = [
	{ x: 0, y: 494, w: 2580, h: 80 },
	{ x: 150, y: 422, w: 190, h: 18 },
	{ x: 405, y: 344, w: 170, h: 18 },
	{ x: 650, y: 262, w: 160, h: 18 },
	{ x: 890, y: 370, w: 200, h: 18 },
	{ x: 1160, y: 286, w: 180, h: 18 },
	{ x: 1410, y: 212, w: 170, h: 18 },
	{ x: 1650, y: 326, w: 170, h: 18 },
	{ x: 1880, y: 390, w: 150, h: 18 },
	{ x: 2080, y: 430, w: 430, h: 18 },
];

const pickups: Pickup[] = [
	{
		id: 'mirror-palace_rocket-issue',
		itemId: 'rocket_backpack',
		x: 225,
		y: 384,
		kind: 'rocket',
		radius: 34,
		taken: false,
		visualState: 'available',
		animation: 'rocket_backpack_pickup',
		persistence: 'saved_once',
	},
	{
		id: 'mirror-palace_echo-spurs',
		itemId: 'echo_spurs',
		x: 710,
		y: 225,
		kind: 'gear',
		radius: 30,
		taken: false,
		visualState: 'available',
		animation: 'echo_spurs_pickup',
		spriteSheetId: 'items_extended',
		persistence: 'saved_once',
	},
	{
		id: 'mirror-palace_phase-mantle',
		itemId: 'phase_mantle',
		x: 1215,
		y: 249,
		kind: 'gear',
		radius: 30,
		taken: false,
		visualState: 'available',
		animation: 'phase_mantle_pickup',
		spriteSheetId: 'items_extended',
		persistence: 'saved_once',
	},
	{
		id: 'mirror-palace_mirror-thread',
		itemId: 'mirror_thread',
		x: 1465,
		y: 175,
		kind: 'gear',
		radius: 30,
		taken: false,
		visualState: 'available',
		animation: 'mirror_thread_pickup',
		spriteSheetId: 'items_extended',
		persistence: 'saved_once',
	},
	{
		id: 'mirror-palace_stim',
		itemId: 'stim_pack',
		x: 1710,
		y: 289,
		kind: 'stim',
		radius: 30,
		taken: false,
		visualState: 'available',
		animation: 'stim_pack_pickup',
		persistence: 'ephemeral',
	},
	{
		id: 'mirror-palace_mirror-pass-payload',
		itemId: 'mirror_pass',
		x: 2440,
		y: 392,
		kind: 'story_payload',
		radius: 34,
		taken: false,
		visualState: 'available',
		animation: 'mirror_pass_pickup',
		persistence: 'story_payload',
	},
];

const enemy = (
	id: string,
	x: number,
	y: number,
	family: 'banquet_usher' | 'mirror_sentinel',
	role: 'bruiser' | 'ranged',
	hp: number
): CombatEntity => ({
	id,
	x,
	y,
	w: 42,
	h: 48,
	vx: family === 'banquet_usher' ? 26 : 0,
	vy: 0,
	dir: -1,
	onGround: true,
	coyoteLeft: 0,
	jumpBuffered: 0,
	hp,
	maxHp: hp,
	armor: family === 'mirror_sentinel' ? 0.2 : 0.12,
	stun: 0,
	invuln: 0,
	procgenFamily: family,
	procgenRole: role,
});

const enemies: CombatEntity[] = [
	enemy('banquet-usher-foyer', 530, 446, 'banquet_usher', 'bruiser', 3),
	enemy('mirror-sentinel-contract', 1015, 322, 'mirror_sentinel', 'ranged', 3),
	enemy('banquet-usher-gallery', 1510, 164, 'banquet_usher', 'bruiser', 4),
	enemy('mirror-sentinel-banquet', 1780, 278, 'mirror_sentinel', 'ranged', 4),
];

export const mirrorPalaceLayout: StageLayout = {
	id: 'mirror-palace-runtime',
	platforms,
	pickups,
	enemies,
};

export function cloneMirrorPalaceLayout(): StageLayout {
	return {
		id: mirrorPalaceLayout.id,
		platforms: mirrorPalaceLayout.platforms.map((platform) => ({ ...platform })),
		pickups: mirrorPalaceLayout.pickups.map((pickup) => ({ ...pickup })),
		enemies: mirrorPalaceLayout.enemies.map((entry) => ({ ...entry })),
	};
}
