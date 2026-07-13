import type { ItemDefinition } from './InventorySystem';

export const FIRST_RELEASE_ITEM_CATALOG: readonly ItemDefinition[] = [
	{
		id: 'claws',
		name: 'Claws',
		slot: 'melee',
		rarity: 'starter',
		tags: ['melee', 'parry'],
		effect: 'Fast slash; parry during enemy flash.',
		iconAnimation: 'claws_icon',
	},
	{
		id: 'rocket_backpack',
		name: 'Rocket Backpack',
		slot: 'active',
		rarity: 'core',
		tags: ['movement', 'fuel'],
		effect: 'Directional burst; recharges on ground and with fuel cells.',
		iconAnimation: 'rocket_backpack_icon',
	},
	{
		id: 'bassline_boots',
		name: 'Bassline Boots',
		slot: 'movement',
		rarity: 'uncommon',
		tags: ['beat', 'landing'],
		effect: 'Landing on beat creates a shockwave.',
		iconAnimation: 'bassline_boots_icon',
	},
	{
		id: 'gravity_talisman',
		name: 'Gravity Talisman',
		slot: 'movement',
		rarity: 'rare',
		tags: ['air', 'flip'],
		effect: 'Bends fall speed and aerial steering.',
		iconAnimation: 'gravity_talisman_icon',
	},
	{
		id: 'railgun',
		name: 'Railgun',
		slot: 'weapon',
		rarity: 'core',
		tags: ['ranged', 'timing'],
		effect: 'Heavy piercing shot with reload cadence and recoil.',
		iconAnimation: 'railgun_icon',
	},
	{
		id: 'katana',
		name: 'Katana',
		slot: 'melee_upgrade',
		rarity: 'rare',
		tags: ['melee', 'perfect'],
		effect: 'Draw slash after parry or perfect dodge.',
		iconAnimation: 'katana_icon',
	},
];

export function getFirstReleaseItem(itemId: string): ItemDefinition | undefined {
	return FIRST_RELEASE_ITEM_CATALOG.find((item) => item.id === itemId);
}
