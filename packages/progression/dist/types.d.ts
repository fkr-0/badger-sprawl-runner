/**
 * @badger/progression -- Meta-progression types
 */
export interface Currency {
    credchips: number;
    blueprintShards: number;
    dubFavor: number;
    orbitHeat: number;
}
export interface Boon {
    id: string;
    name: string;
    tags: string[];
    effectCode: string;
}
export interface RunState {
    damageDealt: number;
    damageTaken: number;
    heatGained: number;
    lootFound: number;
    timeAlive: number;
}
export interface MetaState extends Currency {
    unlockedBoons: string[];
    purchasedSkills: string[];
    skillRanks?: Record<string, number>;
}
export interface ShopItem {
    id: string;
    name: string;
    price: number;
    slot?: string;
}
export interface DerivedStats {
    hp: number;
    rallyWindow: number;
    clawDamage: number;
    katanaDamage: number;
    railDamage: number;
    maxSpeed: number;
    hackTimeBonus: number;
    shopDiscount: number;
    companionSyncRate: number;
}
export interface SkillNode {
    id: string;
    name: string;
    cost: number;
    prereqs: string[];
    unlocked: boolean;
    track?: string;
    tier?: number;
    column?: number;
    branch?: string;
    maxRank?: number;
    rank?: number;
    description?: string;
    iconAnimation?: string;
    effects?: Record<string, number | string | boolean>;
}
export interface RunResult {
    damageDealt: number;
    damageTaken: number;
    heatGained: number;
    timeAlive: number;
    lootCollected: string[];
    rewards: Currency;
}
//# sourceMappingURL=types.d.ts.map