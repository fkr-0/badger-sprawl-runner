/**
 * SkillTree - manages skill nodes and progression
 */

import { computeDerivedStats } from './derivedStats';
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

// Clawline skill tree
const CLAWLINE_NODES: Omit<SkillNode, 'unlocked'>[] = [
	{
		id: 'double_swipe',
		name: 'Double Swipe',
		cost: 1,
		prereqs: [],
		track: 'clawline',
		tier: 1,
		description: 'Unlock the cross-claw follow-up and begin building style faster.',
		iconAnimation: 'double_swipe_icon',
		effects: { unlockMove: 'claw_cross', meleeStyleBonus: 1 },
	},
	{
		id: 'parry_tooth',
		name: 'Parry Tooth',
		cost: 2,
		prereqs: ['double_swipe'],
		track: 'clawline',
		tier: 2,
		description: 'Turn a clean parry into a harder counter and unlock Invoice Splitter.',
		iconAnimation: 'parry_tooth_icon',
		effects: { unlockMove: 'invoice_splitter', parryDamageBonus: 0.75 },
	},
	{
		id: 'claw_rush',
		name: 'Claw Rush',
		cost: 2,
		prereqs: ['parry_tooth'],
		track: 'clawline',
		tier: 3,
		description: 'Cancel recovery into a short pursuit dash.',
		iconAnimation: 'claw_rush_icon',
		effects: { dashCancel: true, velocity: 1, dodgeCooldownReduction: 0.06 },
	},
	{
		id: 'undercut_audit',
		name: 'Undercut Audit',
		cost: 3,
		prereqs: ['claw_rush'],
		track: 'clawline',
		tier: 4,
		description: 'Keep melee chains alive longer and sharpen finishers.',
		iconAnimation: 'undercut_audit_icon',
		effects: { comboWindowBonus: 0.16, finisherDamageBonus: 0.5 },
	},
	{
		id: 'peoples_finisher',
		name: "People's Finisher",
		cost: 4,
		prereqs: ['undercut_audit'],
		track: 'clawline',
		tier: 5,
		description: 'Finishers discharge an EMP and parry counters hit harder.',
		iconAnimation: 'peoples_finisher_icon',
		effects: { finisherEmp: true, parryDamageBonus: 0.5 },
	},
];

export interface ResolvedSkillEffects {
	effects: Record<string, number | string | boolean>;
	trackRanks: Record<(typeof FIRST_RELEASE_SKILL_TRACKS)[number], number>;
}

function mergeEffect(
	target: Record<string, number | string | boolean>,
	key: string,
	value: number | string | boolean
): void {
	const previous = target[key];
	if (typeof value === 'number' && typeof previous === 'number') target[key] = previous + value;
	else if (typeof value === 'boolean' && typeof previous === 'boolean')
		target[key] = previous || value;
	else target[key] = value;
}

export function resolveSkillEffects(skillIds: readonly string[]): ResolvedSkillEffects {
	const unlocked = new Set(skillIds);
	const effects: Record<string, number | string | boolean> = {};
	const trackRanks: ResolvedSkillEffects['trackRanks'] = {
		clawline: 0,
		railgun: 0,
		rocket: 0,
		hacking: 0,
	};

	for (const node of FIRST_RELEASE_SKILL_NODES) {
		if (!unlocked.has(node.id)) continue;
		if (node.track && node.track in trackRanks) {
			const track = node.track as keyof typeof trackRanks;
			trackRanks[track] += 1;
		}
		for (const [key, value] of Object.entries(node.effects ?? {})) mergeEffect(effects, key, value);
	}

	return { effects, trackRanks };
}

// Rail skill tree
const RAIL_NODES: Omit<SkillNode, 'unlocked'>[] = [
	{
		id: 'rail_mastery',
		name: 'Rail Mastery',
		cost: 2,
		prereqs: [],
		track: 'railgun',
		tier: 1,
		description: 'Tune the rail chamber for stronger shots and a quicker cycling cadence.',
		iconAnimation: 'rail_mastery_icon',
		effects: { voltage: 1, railDamageBonus: 0.25, railCooldownReduction: 0.06 },
	},
	{
		id: 'piercing_shot',
		name: 'Piercing Shot',
		cost: 2,
		prereqs: ['rail_mastery'],
		track: 'railgun',
		tier: 2,
		description: 'Punch through one additional aligned target.',
		iconAnimation: 'piercing_shot_icon',
		effects: { railPierceBonus: 1 },
	},
	{
		id: 'capacitor_ritual',
		name: 'Capacitor Ritual',
		cost: 3,
		prereqs: ['piercing_shot'],
		track: 'railgun',
		tier: 3,
		description: 'Bleed recoil into the capacitor and shorten the recovery cycle.',
		iconAnimation: 'capacitor_ritual_icon',
		effects: { railRecoilReduction: 0.35, railCooldownReduction: 0.08 },
	},
	{
		id: 'chain_conductor',
		name: 'Chain Conductor',
		cost: 3,
		prereqs: ['capacitor_ritual'],
		track: 'railgun',
		tier: 4,
		description: 'Every aligned hit strengthens the public arc.',
		iconAnimation: 'chain_conductor_icon',
		effects: { railDamageBonus: 0.35, railPierceBonus: 1 },
	},
	{
		id: 'public_record',
		name: 'Public Record',
		cost: 4,
		prereqs: ['chain_conductor'],
		track: 'railgun',
		tier: 5,
		description: 'Rail hits carry an EMP record through the entire sightline.',
		iconAnimation: 'public_record_icon',
		effects: { empOnChargedShot: true, railPierceBonus: 2 },
	},
];

const ROCKET_NODES: Omit<SkillNode, 'unlocked'>[] = [
	{
		id: 'fuel_sipper',
		name: 'Fuel Sipper',
		cost: 1,
		prereqs: [],
		track: 'rocket',
		tier: 1,
		description: 'Add one fuel cell and improve grounded recharge.',
		iconAnimation: 'fuel_sipper_icon',
		effects: { rocketFuelBonus: 1, fuelRechargeBonus: 0.25 },
	},
	{
		id: 'vector_kick',
		name: 'Vector Kick',
		cost: 2,
		prereqs: ['fuel_sipper'],
		track: 'rocket',
		tier: 2,
		description: 'Steer harder in the air and recover boost sooner.',
		iconAnimation: 'vector_kick_icon',
		effects: { airControlBonus: 0.12, boostCooldownReduction: 0.05 },
	},
	{
		id: 'badger_afterburn',
		name: 'Badger Afterburn',
		cost: 3,
		prereqs: ['vector_kick'],
		track: 'rocket',
		tier: 3,
		description: 'Boosting primes the next strike with a burn trace.',
		iconAnimation: 'badger_afterburn_icon',
		effects: { burnTrailDamage: 0.25 },
	},
	{
		id: 'skyline_reversal',
		name: 'Skyline Reversal',
		cost: 3,
		prereqs: ['badger_afterburn'],
		track: 'rocket',
		tier: 4,
		description: 'Reverse falling momentum and dodge again sooner after landing.',
		iconAnimation: 'skyline_reversal_icon',
		effects: { maxFallSpeedBonus: 90, dodgeCooldownReduction: 0.08 },
	},
	{
		id: 'communal_thrust',
		name: 'Communal Thrust',
		cost: 4,
		prereqs: ['skyline_reversal'],
		track: 'rocket',
		tier: 5,
		description: 'Combat chains feed the shared fuel line.',
		iconAnimation: 'communal_thrust_icon',
		effects: { rocketFuelBonus: 1, fuelRefundOnCombo: 0.5, fuelRechargeBonus: 0.25 },
	},
];

const HACK_NODES: Omit<SkillNode, 'unlocked'>[] = [
	{
		id: 'street_syntax',
		name: 'Street Syntax',
		cost: 1,
		prereqs: [],
		track: 'hacking',
		tier: 1,
		description: 'Forgive the first syntax error and reduce ambient trace.',
		iconAnimation: 'street_syntax_icon',
		effects: { cortex: 1, firstHackMistakeIgnored: true, traceReduction: 0.05 },
	},
	{
		id: 'black_ice_bite',
		name: 'Black Ice Bite',
		cost: 2,
		prereqs: ['street_syntax'],
		track: 'hacking',
		tier: 2,
		description: 'Successful code work charges the next close-range counter.',
		iconAnimation: 'black_ice_bite_icon',
		effects: { hackChargesMelee: true, parryDamageBonus: 0.25 },
	},
	{
		id: 'ghost_invoice',
		name: 'Ghost Invoice',
		cost: 2,
		prereqs: ['black_ice_bite'],
		track: 'hacking',
		tier: 3,
		description: 'Erase a larger share of accumulated trace.',
		iconAnimation: 'ghost_invoice_icon',
		effects: { traceReduction: 0.2 },
	},
	{
		id: 'remote_arc',
		name: 'Remote Arc',
		cost: 3,
		prereqs: ['ghost_invoice'],
		track: 'hacking',
		tier: 4,
		description: 'Route terminal charge into railgun EMP payloads.',
		iconAnimation: 'remote_arc_icon',
		effects: { empOnChargedShot: true, railDamageBonus: 0.15 },
	},
	{
		id: 'public_exploit',
		name: 'Public Exploit',
		cost: 4,
		prereqs: ['remote_arc'],
		track: 'hacking',
		tier: 5,
		description: 'Share the exploit: broader timing grace and a thin defensive checksum.',
		iconAnimation: 'public_exploit_icon',
		effects: { beatGrace: 0.06, damageMitigation: 0.08, traceReduction: 0.1 },
	},
];

export const FIRST_RELEASE_SKILL_TRACKS = ['clawline', 'railgun', 'rocket', 'hacking'] as const;
export const FIRST_RELEASE_SKILL_NODES: Omit<SkillNode, 'unlocked'>[] = [
	...CLAWLINE_NODES,
	...RAIL_NODES,
	...ROCKET_NODES,
	...HACK_NODES,
];

export class SkillTree {
	private graph: SkillGraph;

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
			this.graph.nodes.set(node.id, {
				...node,
				effects: { ...(node.effects ?? {}) },
				unlocked: false,
			});
		}
	}

	unlockNode(nodeId: string): boolean {
		const node = this.graph.nodes.get(nodeId);
		if (!node) return false;

		if (node.unlocked) return false; // Already unlocked

		// Check prerequisites
		const hasPrereqs = node.prereqs.every((prereqId) => {
			const prereq = this.graph.nodes.get(prereqId);
			return prereq?.unlocked ?? false;
		});

		if (!hasPrereqs) return false;

		// Check skill points
		if (this.graph.skillPoints < node.cost) return false;

		// Unlock
		node.unlocked = true;
		this.graph.skillPoints -= node.cost;

		// Apply stat bonuses based on skill
		this.applySkillBonus(nodeId);

		return true;
	}

	canUnlock(nodeId: string): boolean {
		const node = this.graph.nodes.get(nodeId);
		if (!node || node.unlocked) return false;

		const hasPrereqs = node.prereqs.every((prereqId) => {
			const prereq = this.graph.nodes.get(prereqId);
			return prereq?.unlocked ?? false;
		});

		return hasPrereqs && this.graph.skillPoints >= node.cost;
	}

	getAvailableNodes(): SkillNode[] {
		const available: SkillNode[] = [];
		for (const node of this.graph.nodes.values()) {
			if (!node.unlocked && this.canUnlock(node.id)) {
				available.push(node);
			}
		}
		return available;
	}

	getUnlockedNodes(): SkillNode[] {
		const unlocked: SkillNode[] = [];
		for (const node of this.graph.nodes.values()) {
			if (node.unlocked) {
				unlocked.push(node);
			}
		}
		return unlocked;
	}

	getNode(nodeId: string): SkillNode | undefined {
		return this.graph.nodes.get(nodeId);
	}

	addSkillPoints(amount: number): void {
		this.graph.skillPoints += amount;
	}

	getSkillPoints(): number {
		return this.graph.skillPoints;
	}

	getAttributes(): SkillGraph['attributes'] {
		return { ...this.graph.attributes };
	}

	addAttribute(attribute: keyof SkillGraph['attributes'], amount: number): void {
		this.graph.attributes[attribute] += amount;
	}

	computeDerivedStats(): DerivedStats {
		return computeDerivedStats(this.graph.attributes);
	}

	private applySkillBonus(skillId: string): void {
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
			case 'public_record':
				// EMP rail capstone
				break;
		}
	}
}

export function createSkillTree(): SkillTree {
	return new SkillTree();
}

export type SkillPurchaseFailure =
	| 'unknown-skill'
	| 'already-unlocked'
	| 'missing-prerequisite'
	| 'insufficient-shards';

export type SkillPurchaseResult =
	| { ok: true; state: import('./types').MetaState; node: SkillNode }
	| { ok: false; state: import('./types').MetaState; reason: SkillPurchaseFailure };

export function hydrateSkillTree(purchasedSkills: readonly string[]): SkillTree {
	const tree = createSkillTree();
	for (const skillId of purchasedSkills) {
		const node = tree.getNode(skillId);
		if (!node) continue;
		tree.addSkillPoints(node.cost);
		tree.unlockNode(skillId);
	}
	return tree;
}

export function purchaseSkillWithMeta(
	tree: SkillTree,
	state: import('./types').MetaState,
	nodeId: string
): SkillPurchaseResult {
	const node = tree.getNode(nodeId);
	if (!node) return { ok: false, state, reason: 'unknown-skill' };
	if (node.unlocked || state.purchasedSkills.includes(nodeId)) {
		return { ok: false, state, reason: 'already-unlocked' };
	}

	const hasPrerequisites = node.prereqs.every(
		(prereqId) => tree.getNode(prereqId)?.unlocked || state.purchasedSkills.includes(prereqId)
	);
	if (!hasPrerequisites) return { ok: false, state, reason: 'missing-prerequisite' };
	if (state.blueprintShards < node.cost) return { ok: false, state, reason: 'insufficient-shards' };

	tree.addSkillPoints(node.cost);
	if (!tree.unlockNode(nodeId)) return { ok: false, state, reason: 'missing-prerequisite' };

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
