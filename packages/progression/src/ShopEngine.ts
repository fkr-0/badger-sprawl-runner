/**
 * ShopEngine - generates shop offers with pricing
 */

export interface ShopItem {
	id: string;
	name: string;
	price: number;
	tags: string[];
}

export interface ShopOffer {
	items: ShopItem[];
	world: string;
	heat: number;
}

export interface ShopCatalogItem {
	id: string;
	name: string;
	rarity: string;
	tags: string[];
}

export class ShopEngine {
	generateOffer(
		world: string,
		heat: number,
		dubFavor: number,
		guile: number,
		items: ShopCatalogItem[]
	): ShopOffer {
		const discount = Math.min(0.3, guile * 0.02);
		const shopItems: ShopItem[] = [];

		for (const item of items) {
			const basePrice = this.getBasePrice(item.rarity);
			shopItems.push({
				id: item.id,
				name: item.name,
				price: Math.floor(basePrice * (1 - discount)),
				tags: item.tags,
			});
		}

		return { items: shopItems, world, heat };
	}

	private getBasePrice(rarity: string): number {
		switch (rarity) {
			case 'common':
				return 50;
			case 'rare':
				return 150;
			case 'epic':
				return 400;
			default:
				return 100;
		}
	}
}
