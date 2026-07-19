import type { CombatEntity } from '../systems/CombatSystem';
import type { Pickup } from '../systems/ItemSystem';
import type { Platform } from '../systems/PhysicsSystem';
import type { StageLayout } from './lowerSprawlLayout';

const platforms: Platform[] = [
	{ x: 0, y: 494, w: 2820, h: 80 },
	{ x: 130, y: 420, w: 220, h: 18 },
	{ x: 420, y: 342, w: 190, h: 18 },
	{ x: 680, y: 270, w: 180, h: 18 },
	{ x: 930, y: 386, w: 230, h: 18 },
	{ x: 1240, y: 300, w: 190, h: 18 },
	{ x: 1510, y: 220, w: 190, h: 18 },
	{ x: 1770, y: 338, w: 190, h: 18 },
	{ x: 2020, y: 270, w: 180, h: 18 },
	{ x: 2250, y: 410, w: 490, h: 18 },
];

const pickups: Pickup[] = [
	{
		id: 'dub-colony-shield-cache',
		itemId: 'dub_shield',
		x: 255,
		y: 382,
		kind: 'gear',
		radius: 32,
		taken: false,
		visualState: 'available',
		animation: 'dub_shield_pickup',
		persistence: 'saved_once',
	},
	{
		id: 'dub-colony-bassline-boots',
		itemId: 'bassline_boots',
		x: 740,
		y: 233,
		kind: 'set_piece',
		radius: 30,
		taken: false,
		visualState: 'available',
		animation: 'bassline_boots_pickup',
		persistence: 'saved_once',
	},
	{
		id: 'dub-colony-echo-cassette',
		itemId: 'echo_cassette',
		x: 1305,
		y: 263,
		kind: 'gear',
		radius: 30,
		taken: false,
		visualState: 'available',
		animation: 'echo_cassette_pickup',
		persistence: 'saved_once',
	},
	{
		id: 'dub-colony-solder-mites',
		itemId: 'solder_mite_swarm',
		x: 1575,
		y: 183,
		kind: 'gear',
		radius: 30,
		taken: false,
		visualState: 'available',
		animation: 'solder_mite_swarm_pickup',
		spriteSheetId: 'items_extended',
		persistence: 'saved_once',
	},
	{
		id: 'dub-colony-stim',
		itemId: 'stim_pack',
		x: 1840,
		y: 301,
		kind: 'stim',
		radius: 30,
		taken: false,
		visualState: 'available',
		animation: 'stim_pack_pickup',
		persistence: 'ephemeral',
	},
	{
		id: 'dub-colony-bass-reactor-core-payload',
		itemId: 'bass_reactor_core',
		x: 2670,
		y: 374,
		kind: 'story_payload',
		radius: 36,
		taken: false,
		visualState: 'available',
		animation: 'bass_reactor_core_pickup',
		persistence: 'story_payload',
	},
];

function enemy(
	id: string,
	x: number,
	y: number,
	family: 'signal_jammer_bat' | 'feedback_guard',
	role: 'ranged' | 'bruiser',
	hp: number
): CombatEntity {
	return {
		id,
		x,
		y,
		w: family === 'signal_jammer_bat' ? 42 : 46,
		h: family === 'signal_jammer_bat' ? 38 : 50,
		vx: family === 'signal_jammer_bat' ? 18 : 24,
		vy: 0,
		dir: -1,
		onGround: family === 'feedback_guard',
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp,
		maxHp: hp,
		armor: family === 'feedback_guard' ? 0.32 : 0.08,
		guardMultiplier: family === 'feedback_guard' ? 0.45 : 1,
		stun: 0,
		invuln: 0,
		procgenFamily: family,
		procgenRole: role,
	};
}

const enemies: CombatEntity[] = [
	enemy('jammer-bat-greenhouse', 535, 285, 'signal_jammer_bat', 'ranged', 3),
	enemy('feedback-guard-studio', 1040, 336, 'feedback_guard', 'bruiser', 4),
	enemy('jammer-bat-reactor', 1610, 150, 'signal_jammer_bat', 'ranged', 4),
	enemy('feedback-guard-assembly', 2050, 220, 'feedback_guard', 'bruiser', 5),
];

export const dubColonyLayout: StageLayout = {
	id: 'dub-colony-runtime',
	platforms,
	pickups,
	enemies,
};

export function cloneDubColonyLayout(): StageLayout {
	return {
		id: dubColonyLayout.id,
		platforms: dubColonyLayout.platforms.map((platform) => ({ ...platform })),
		pickups: dubColonyLayout.pickups.map((pickup) => ({ ...pickup })),
		enemies: dubColonyLayout.enemies.map((entry) => ({ ...entry })),
	};
}
