/**
 * SkillTree - manages skill nodes and progression
 */
import type { DerivedStats, SkillNode } from './types';
export interface SkillGraph {
    nodes: Map<string, SkillNode>;
    attributes: {
        vigor: number;
        sinew: number;
        voltage: number;
        velocity: number;
        cortex: number;
        bass: number;
        guile: number;
    };
    skillPoints: number;
}
export interface ResolvedSkillEffects {
    effects: Record<string, number | string | boolean>;
    trackRanks: Record<(typeof FIRST_RELEASE_SKILL_TRACKS)[number], number>;
}
export declare function resolveSkillEffects(skillIds: readonly string[]): ResolvedSkillEffects;
export declare const FIRST_RELEASE_SKILL_TRACKS: readonly ["clawline", "railgun", "rocket", "hacking"];
export declare const FIRST_RELEASE_SKILL_NODES: Omit<SkillNode, 'unlocked'>[];
export declare class SkillTree {
    private graph;
    constructor();
    unlockNode(nodeId: string): boolean;
    canUnlock(nodeId: string): boolean;
    getAvailableNodes(): SkillNode[];
    getUnlockedNodes(): SkillNode[];
    getNode(nodeId: string): SkillNode | undefined;
    addSkillPoints(amount: number): void;
    getSkillPoints(): number;
    getAttributes(): SkillGraph['attributes'];
    addAttribute(attribute: keyof SkillGraph['attributes'], amount: number): void;
    computeDerivedStats(): DerivedStats;
    private applySkillBonus;
}
export declare function createSkillTree(): SkillTree;
export type SkillPurchaseFailure = 'unknown-skill' | 'already-unlocked' | 'missing-prerequisite' | 'insufficient-shards';
export type SkillPurchaseResult = {
    ok: true;
    state: import('./types').MetaState;
    node: SkillNode;
} | {
    ok: false;
    state: import('./types').MetaState;
    reason: SkillPurchaseFailure;
};
export declare function hydrateSkillTree(purchasedSkills: readonly string[]): SkillTree;
export declare function purchaseSkillWithMeta(tree: SkillTree, state: import('./types').MetaState, nodeId: string): SkillPurchaseResult;
export { computeDerivedStats } from './derivedStats';
//# sourceMappingURL=SkillTree.d.ts.map