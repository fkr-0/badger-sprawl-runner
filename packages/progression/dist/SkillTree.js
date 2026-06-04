/**
 * SkillTree - manages skill nodes and progression
 */
import { computeDerivedStats } from './derivedStats';
// Clawline skill tree
const CLAWLINE_NODES = [
    {
        id: 'double_swipe',
        name: 'Double Swipe',
        cost: 1,
        prereqs: [],
        track: 'clawline',
        effects: { unlockMove: 'claw_cross', meleeStyleBonus: 1 },
    },
    {
        id: 'parry_tooth',
        name: 'Parry Tooth',
        cost: 2,
        prereqs: ['double_swipe'],
        track: 'clawline',
        effects: { unlockMove: 'invoice_splitter', parryDamageBonus: 1 },
    },
    {
        id: 'claw_rush',
        name: 'Claw Rush',
        cost: 2,
        prereqs: ['parry_tooth'],
        track: 'clawline',
        effects: { dashCancel: true, velocity: 1 },
    },
];
// Rail skill tree
const RAIL_NODES = [
    {
        id: 'rail_mastery',
        name: 'Rail Mastery',
        cost: 2,
        prereqs: [],
        track: 'railgun',
        effects: { voltage: 1, reloadGrace: 0.08 },
    },
    {
        id: 'piercing_shot',
        name: 'Piercing Shot',
        cost: 2,
        prereqs: ['rail_mastery'],
        track: 'railgun',
        effects: { pierceCount: 1 },
    },
    {
        id: 'emp_blast',
        name: 'EMP Blast',
        cost: 3,
        prereqs: ['piercing_shot'],
        track: 'railgun',
        effects: { empOnChargedShot: true },
    },
];
const ROCKET_NODES = [
    {
        id: 'fuel_sipper',
        name: 'Fuel Sipper',
        cost: 1,
        prereqs: [],
        track: 'rocket',
        effects: { rocketFuelBonus: 1 },
    },
    {
        id: 'vector_kick',
        name: 'Vector Kick',
        cost: 2,
        prereqs: ['fuel_sipper'],
        track: 'rocket',
        effects: { airControlBonus: 0.12 },
    },
    {
        id: 'badger_afterburn',
        name: 'Badger Afterburn',
        cost: 3,
        prereqs: ['vector_kick'],
        track: 'rocket',
        effects: { burnTrailDamage: 1 },
    },
];
const HACK_NODES = [
    {
        id: 'street_syntax',
        name: 'Street Syntax',
        cost: 1,
        prereqs: [],
        track: 'hacking',
        effects: { cortex: 1, firstHackMistakeIgnored: true },
    },
    {
        id: 'black_ice_bite',
        name: 'Black Ice Bite',
        cost: 2,
        prereqs: ['street_syntax'],
        track: 'hacking',
        effects: { hackChargesMelee: true },
    },
    {
        id: 'ghost_invoice',
        name: 'Ghost Invoice',
        cost: 2,
        prereqs: ['black_ice_bite'],
        track: 'hacking',
        effects: { traceReduction: 0.2 },
    },
];
export const FIRST_RELEASE_SKILL_TRACKS = ['clawline', 'railgun', 'rocket', 'hacking'];
export const FIRST_RELEASE_SKILL_NODES = [
    ...CLAWLINE_NODES,
    ...RAIL_NODES,
    ...ROCKET_NODES,
    ...HACK_NODES,
];
export class SkillTree {
    graph;
    constructor() {
        this.graph = {
            nodes: new Map(),
            attributes: {
                vigor: 0,
                sinew: 0,
                voltage: 0,
                velocity: 0,
                cortex: 0,
                bass: 0,
                guile: 0,
            },
            skillPoints: 0,
        };
        // Initialize nodes
        for (const node of FIRST_RELEASE_SKILL_NODES) {
            this.graph.nodes.set(node.id, { ...node, effects: { ...(node.effects ?? {}) }, unlocked: false });
        }
    }
    unlockNode(nodeId) {
        const node = this.graph.nodes.get(nodeId);
        if (!node)
            return false;
        if (node.unlocked)
            return false; // Already unlocked
        // Check prerequisites
        const hasPrereqs = node.prereqs.every((prereqId) => {
            const prereq = this.graph.nodes.get(prereqId);
            return prereq?.unlocked ?? false;
        });
        if (!hasPrereqs)
            return false;
        // Check skill points
        if (this.graph.skillPoints < node.cost)
            return false;
        // Unlock
        node.unlocked = true;
        this.graph.skillPoints -= node.cost;
        // Apply stat bonuses based on skill
        this.applySkillBonus(nodeId);
        return true;
    }
    canUnlock(nodeId) {
        const node = this.graph.nodes.get(nodeId);
        if (!node || node.unlocked)
            return false;
        const hasPrereqs = node.prereqs.every((prereqId) => {
            const prereq = this.graph.nodes.get(prereqId);
            return prereq?.unlocked ?? false;
        });
        return hasPrereqs && this.graph.skillPoints >= node.cost;
    }
    getAvailableNodes() {
        const available = [];
        for (const node of this.graph.nodes.values()) {
            if (!node.unlocked && this.canUnlock(node.id)) {
                available.push(node);
            }
        }
        return available;
    }
    getUnlockedNodes() {
        const unlocked = [];
        for (const node of this.graph.nodes.values()) {
            if (node.unlocked) {
                unlocked.push(node);
            }
        }
        return unlocked;
    }
    getNode(nodeId) {
        return this.graph.nodes.get(nodeId);
    }
    addSkillPoints(amount) {
        this.graph.skillPoints += amount;
    }
    getSkillPoints() {
        return this.graph.skillPoints;
    }
    getAttributes() {
        return { ...this.graph.attributes };
    }
    addAttribute(attribute, amount) {
        this.graph.attributes[attribute] += amount;
    }
    computeDerivedStats() {
        return computeDerivedStats(this.graph.attributes);
    }
    applySkillBonus(skillId) {
        // Apply skill-specific bonuses
        switch (skillId) {
            case 'double_swipe':
                // Combo starter
                break;
            case 'parry_tooth':
                // Parry damage boost
                break;
            case 'claw_rush':
                // Movement speed boost
                this.graph.attributes.velocity += 1;
                break;
            case 'rail_mastery':
                // Rail damage boost
                this.graph.attributes.voltage += 1;
                break;
            case 'piercing_shot':
                // Pierce effect
                break;
            case 'emp_blast':
                // EMP effect
                break;
        }
    }
}
export function createSkillTree() {
    return new SkillTree();
}
export function hydrateSkillTree(purchasedSkills) {
    const tree = createSkillTree();
    for (const skillId of purchasedSkills) {
        const node = tree.getNode(skillId);
        if (!node)
            continue;
        tree.addSkillPoints(node.cost);
        tree.unlockNode(skillId);
    }
    return tree;
}
export function purchaseSkillWithMeta(tree, state, nodeId) {
    const node = tree.getNode(nodeId);
    if (!node)
        return { ok: false, state, reason: 'unknown-skill' };
    if (node.unlocked || state.purchasedSkills.includes(nodeId)) {
        return { ok: false, state, reason: 'already-unlocked' };
    }
    const hasPrerequisites = node.prereqs.every((prereqId) => tree.getNode(prereqId)?.unlocked || state.purchasedSkills.includes(prereqId));
    if (!hasPrerequisites)
        return { ok: false, state, reason: 'missing-prerequisite' };
    if (state.blueprintShards < node.cost)
        return { ok: false, state, reason: 'insufficient-shards' };
    tree.addSkillPoints(node.cost);
    if (!tree.unlockNode(nodeId))
        return { ok: false, state, reason: 'missing-prerequisite' };
    return {
        ok: true,
        node,
        state: {
            ...state,
            blueprintShards: state.blueprintShards - node.cost,
            purchasedSkills: [...state.purchasedSkills, nodeId],
        },
    };
}
export { computeDerivedStats } from './derivedStats';
//# sourceMappingURL=SkillTree.js.map