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
	dubFavor: number;
	guile: number;
	priceModifier: number;
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
		const priceModifier = this.getPriceModifier(heat, dubFavor, guile);
		const shopItems: ShopItem[] = [];

		for (const item of items) {
			const basePrice = this.getBasePrice(item.rarity);
			shopItems.push({
				id: item.id,
				name: item.name,
				price: Math.max(1, Math.floor(basePrice * priceModifier)),
				tags: item.tags,
			});
		}

		return { items: shopItems, world, heat, dubFavor, guile, priceModifier };
	}

	getPriceModifier(heat: number, dubFavor: number, guile: number): number {
		const heatMarkup = Math.min(0.45, Math.max(0, heat) * 0.03);
		const favorDiscount = Math.min(0.25, Math.max(0, dubFavor) * 0.025);
		const guileDiscount = Math.min(0.3, Math.max(0, guile) * 0.02);
		return Math.max(0.5, Number((1 + heatMarkup - favorDiscount - guileDiscount).toFixed(3)));
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
