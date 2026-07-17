/**
 * SkillTree - four branched, save-compatible disciplines.
 */
import type { DerivedStats, MetaState, SkillNode } from './types';
export declare const FIRST_RELEASE_SKILL_TRACKS: readonly ["clawline", "railgun", "rocket", "hacking"];
export type SkillTrackId = (typeof FIRST_RELEASE_SKILL_TRACKS)[number];
export declare const SKILL_TRACK_PRESENTATION: Record<SkillTrackId, {
    label: string;
    shortLabel: string;
    description: string;
}>;
type SkillDefinition = Omit<SkillNode, 'unlocked' | 'rank'>;
export declare const FIRST_RELEASE_SKILL_NODES: SkillDefinition[];
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
    trackRanks: Record<SkillTrackId, number>;
}
export declare function resolveSkillEffects(skillIds: readonly string[], skillRanks?: Readonly<Record<string, number>>): ResolvedSkillEffects;
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
    state: MetaState;
    node: SkillNode;
} | {
    ok: false;
    state: MetaState;
    reason: SkillPurchaseFailure;
};
export declare function hydrateSkillTree(purchasedSkills: readonly string[], skillRanks?: Readonly<Record<string, number>>): SkillTree;
export declare function purchaseSkillWithMeta(tree: SkillTree, state: MetaState, nodeId: string): SkillPurchaseResult;
export { computeDerivedStats } from './derivedStats';
//# sourceMappingURL=SkillTree.d.ts.map