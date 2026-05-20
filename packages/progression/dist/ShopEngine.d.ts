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
export declare class ShopEngine {
    generateOffer(world: string, heat: number, dubFavor: number, guile: number, items: ShopCatalogItem[]): ShopOffer;
    getPriceModifier(heat: number, dubFavor: number, guile: number): number;
    private getBasePrice;
}
//# sourceMappingURL=ShopEngine.d.ts.map