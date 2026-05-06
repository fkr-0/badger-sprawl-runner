/**
 * SkillTree - manages skill nodes and progression
 */
import type { SkillNode, DerivedStats } from './types';
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
export { computeDerivedStats } from './derivedStats';
//# sourceMappingURL=SkillTree.d.ts.map