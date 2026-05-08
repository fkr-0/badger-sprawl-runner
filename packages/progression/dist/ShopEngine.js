/**
 * ShopEngine - generates shop offers with pricing
 */
export class ShopEngine {
    generateOffer(world, heat, dubFavor, guile, items) {
        const discount = Math.min(0.3, guile * 0.02);
        const shopItems = [];
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
    getBasePrice(rarity) {
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
//# sourceMappingURL=ShopEngine.js.map