/**
 * SkillTree - four branched, save-compatible disciplines.
 */
import { computeDerivedStats } from './derivedStats';
export const FIRST_RELEASE_SKILL_TRACKS = ['clawline', 'railgun', 'rocket', 'hacking'];
export const SKILL_TRACK_PRESENTATION = {
    clawline: {
        label: 'Hand-to-Hand / Claw Combat',
        shortLabel: 'CLAW COMBAT',
        description: 'Parries, pursuit, grapples and close-range finishers.',
    },
    railgun: {
        label: 'Ballistics',
        shortLabel: 'BALLISTICS',
        description: 'Rail discipline, ricochet math, suppression and smart payloads.',
    },
    rocket: {
        label: 'Stealth / Climbing / Acrobatics',
        shortLabel: 'GHOSTSTEP',
        description: 'Quiet movement, wall routes, aerial recovery and pursuit breaks.',
    },
    hacking: {
        label: 'Hacking',
        shortLabel: 'HACKING',
        description: 'Trace control, daemon routing, remote exploits and battlefield hijacks.',
    },
};
function skill(id, name, track, tier, column, cost, prereqs, description, effects, options = {}) {
    return {
        id,
        name,
        track,
        tier,
        column,
        cost,
        prereqs,
        description,
        effects,
        maxRank: options.maxRank ?? 1,
        branch: options.branch ?? 'core',
        iconAnimation: options.iconAnimation,
    };
}
const CLAWLINE_NODES = [
    skill('double_swipe', 'Double Swipe', 'clawline', 1, 1, 1, [], 'Unlock the cross-claw follow-up and build style faster.', { unlockMove: 'claw_cross', meleeStyleBonus: 1 }, { iconAnimation: 'double_swipe_icon' }),
    skill('parry_tooth', 'Parry Tooth', 'clawline', 2, 1, 2, ['double_swipe'], 'Turn a clean parry into a harder counter and unlock Invoice Splitter.', { unlockMove: 'invoice_splitter', parryDamageBonus: 0.75 }, { iconAnimation: 'parry_tooth_icon' }),
    skill('claw_rush', 'Claw Rush', 'clawline', 3, 1, 2, ['parry_tooth'], 'Cancel recovery into a short pursuit dash.', { dashCancel: true, velocity: 1, dodgeCooldownReduction: 0.06 }, { iconAnimation: 'claw_rush_icon' }),
    skill('undercut_audit', 'Undercut Audit', 'clawline', 4, 1, 3, ['claw_rush'], 'Keep melee chains alive longer and sharpen finishers.', { comboWindowBonus: 0.16, finisherDamageBonus: 0.5 }, { iconAnimation: 'undercut_audit_icon' }),
    skill('peoples_finisher', "People's Finisher", 'clawline', 5, 1, 4, ['undercut_audit', 'pack_hunter'], 'Finishers discharge an EMP and parry counters hit harder.', { finisherEmp: true, parryDamageBonus: 0.5 }, { iconAnimation: 'peoples_finisher_icon' }),
    skill('iron_knuckles', 'Iron Knuckles', 'clawline', 1, 0, 1, [], 'Layer salvaged guards over the paw without slowing the strike.', { clawDamageBonus: 0.12, poiseDamageBonus: 0.08 }, { maxRank: 3, branch: 'pressure', iconAnimation: 'double_swipe_icon' }),
    skill('slip_guard', 'Slip Guard', 'clawline', 1, 2, 1, [], 'Roll the shoulder through contact and recover guard sooner.', { damageMitigation: 0.025, parryWindowBonus: 0.025 }, { maxRank: 3, branch: 'counter', iconAnimation: 'parry_tooth_icon' }),
    skill('rake_opening', 'Rake Opening', 'clawline', 2, 0, 2, ['iron_knuckles'], 'A low rake exposes armor seams for the rest of the string.', { armorShred: 0.08, meleeStyleBonus: 1 }, { maxRank: 3, branch: 'pressure', iconAnimation: 'double_swipe_icon' }),
    skill('tendon_read', 'Tendon Read', 'clawline', 2, 2, 2, ['slip_guard'], 'Read the telegraph in a knee, tail or servo before it commits.', { parryWindowBonus: 0.035, counterDamageBonus: 0.12 }, { maxRank: 3, branch: 'counter', iconAnimation: 'parry_tooth_icon' }),
    skill('ribcage_rhythm', 'Ribcage Rhythm', 'clawline', 3, 0, 2, ['rake_opening'], 'Alternating body shots accelerate the next finisher.', { comboWindowBonus: 0.05, finisherDamageBonus: 0.12 }, { maxRank: 3, branch: 'pressure', iconAnimation: 'undercut_audit_icon' }),
    skill('counter_current', 'Counter Current', 'clawline', 3, 2, 2, ['tendon_read'], 'A successful counter refunds dodge cadence.', { dodgeCooldownReduction: 0.04, parryDamageBonus: 0.16 }, { maxRank: 3, branch: 'counter', iconAnimation: 'claw_rush_icon' }),
    skill('pack_hunter', 'Pack Hunter', 'clawline', 4, 2, 3, ['counter_current', 'ribcage_rhythm'], 'Cross pressure and counter branches; isolated targets lose poise quickly.', { isolatedDamageBonus: 0.25, poiseDamageBonus: 0.2 }, { branch: 'capstone', iconAnimation: 'peoples_finisher_icon' }),
];
const BALLISTICS_NODES = [
    skill('rail_mastery', 'Rail Mastery', 'railgun', 1, 1, 2, [], 'Tune the rail chamber for stronger shots and quicker cycling.', { voltage: 1, railDamageBonus: 0.25, railCooldownReduction: 0.06 }, { iconAnimation: 'rail_mastery_icon' }),
    skill('piercing_shot', 'Piercing Shot', 'railgun', 2, 1, 2, ['rail_mastery'], 'Punch through one additional aligned target.', { railPierceBonus: 1 }, { iconAnimation: 'piercing_shot_icon' }),
    skill('capacitor_ritual', 'Capacitor Ritual', 'railgun', 3, 1, 3, ['piercing_shot'], 'Bleed recoil into the capacitor and shorten recovery.', { railRecoilReduction: 0.35, railCooldownReduction: 0.08 }, { iconAnimation: 'capacitor_ritual_icon' }),
    skill('chain_conductor', 'Chain Conductor', 'railgun', 4, 1, 3, ['capacitor_ritual'], 'Every aligned hit strengthens the public arc.', { railDamageBonus: 0.35, railPierceBonus: 1 }, { iconAnimation: 'chain_conductor_icon' }),
    skill('public_record', 'Public Record', 'railgun', 5, 1, 4, ['chain_conductor', 'linebreaker'], 'Rail hits carry an EMP record through the sightline.', { empOnChargedShot: true, railPierceBonus: 2 }, { iconAnimation: 'public_record_icon' }),
    skill('quickdraw_bus', 'Quickdraw Bus', 'railgun', 1, 0, 1, [], 'Snap the weapon online while leaving a dodge.', { railChargeReduction: 0.05, railCooldownReduction: 0.025 }, { maxRank: 3, branch: 'handling', iconAnimation: 'rail_mastery_icon' }),
    skill('breach_math', 'Breach Math', 'railgun', 1, 2, 1, [], 'Annotate armor joins and weak structural spans.', { railDamageBonus: 0.08, armorPierceBonus: 0.06 }, { maxRank: 3, branch: 'ordnance', iconAnimation: 'piercing_shot_icon' }),
    skill('recoil_dividend', 'Recoil Dividend', 'railgun', 2, 0, 2, ['quickdraw_bus'], 'Convert a controlled kick into movement and charge.', { railRecoilReduction: 0.12, velocity: 0.5 }, { maxRank: 3, branch: 'handling', iconAnimation: 'capacitor_ritual_icon' }),
    skill('ricochet_union', 'Ricochet Union', 'railgun', 2, 2, 2, ['breach_math'], 'Hard surfaces vote the round toward a second target.', { ricochetCount: 1, ricochetDamage: 0.12 }, { maxRank: 3, branch: 'ordnance', iconAnimation: 'piercing_shot_icon' }),
    skill('suppressive_chorus', 'Suppressive Chorus', 'railgun', 3, 0, 2, ['recoil_dividend'], 'Repeated lanes slow hostile windups.', { suppressDuration: 0.18, railCooldownReduction: 0.03 }, { maxRank: 3, branch: 'handling', iconAnimation: 'chain_conductor_icon' }),
    skill('smart_payload', 'Smart Payload', 'railgun', 3, 2, 2, ['ricochet_union'], 'Charged rounds choose exposed electronics first.', { criticalChanceBonus: 0.05, empDamageBonus: 0.12 }, { maxRank: 3, branch: 'ordnance', iconAnimation: 'public_record_icon' }),
    skill('linebreaker', 'Linebreaker', 'railgun', 4, 2, 3, ['smart_payload', 'suppressive_chorus'], 'Merge handling and ordnance: one prepared shot opens the whole lane.', { railPierceBonus: 1, railDamageBonus: 0.3 }, { branch: 'capstone', iconAnimation: 'public_record_icon' }),
];
const GHOSTSTEP_NODES = [
    skill('fuel_sipper', 'Quiet Fuel', 'rocket', 1, 1, 1, [], 'Muffle the pack intake, add one cell and improve grounded recharge.', { rocketFuelBonus: 1, fuelRechargeBonus: 0.25 }, { iconAnimation: 'fuel_sipper_icon' }),
    skill('vector_kick', 'Vector Kick', 'rocket', 2, 1, 2, ['fuel_sipper'], 'Steer harder in the air and recover boost sooner.', { airControlBonus: 0.12, boostCooldownReduction: 0.05 }, { iconAnimation: 'vector_kick_icon' }),
    skill('badger_afterburn', 'Badger Afterburn', 'rocket', 3, 1, 3, ['vector_kick'], 'Boost through a blind angle and prime the next strike.', { burnTrailDamage: 0.25, stealthExitDamage: 0.2 }, { iconAnimation: 'badger_afterburn_icon' }),
    skill('skyline_reversal', 'Skyline Reversal', 'rocket', 4, 1, 3, ['badger_afterburn'], 'Reverse falling momentum and dodge sooner after landing.', { maxFallSpeedBonus: 90, dodgeCooldownReduction: 0.08 }, { iconAnimation: 'skyline_reversal_icon' }),
    skill('communal_thrust', 'Sprawl Without Footsteps', 'rocket', 5, 1, 4, ['skyline_reversal', 'vanishing_point'], 'Chains feed fuel while enemies lose the route entirely.', { rocketFuelBonus: 1, fuelRefundOnCombo: 0.5, stealthDurationBonus: 0.5 }, { iconAnimation: 'communal_thrust_icon' }),
    skill('wall_scent', 'Wall Scent', 'rocket', 1, 0, 1, [], 'Read handholds, drain seams and climbable service scars.', { climbSpeedBonus: 0.08, wallGripTimeBonus: 0.2 }, { maxRank: 3, branch: 'climbing', iconAnimation: 'vector_kick_icon' }),
    skill('soft_paw', 'Soft Paw', 'rocket', 1, 2, 1, [], 'Reduce landing noise and enemy hearing radius.', { noiseReduction: 0.12, stealthDurationBonus: 0.08 }, { maxRank: 3, branch: 'stealth', iconAnimation: 'fuel_sipper_icon' }),
    skill('gutter_ascension', 'Gutter Ascension', 'rocket', 2, 0, 2, ['wall_scent'], 'Chain wall grips into a fast vertical route.', { climbSpeedBonus: 0.1, wallJumpBonus: 0.08 }, { maxRank: 3, branch: 'climbing', iconAnimation: 'skyline_reversal_icon' }),
    skill('shadow_invoice', 'Shadow Invoice', 'rocket', 2, 2, 2, ['soft_paw'], 'Mark unaware enemies; the first hit collects interest.', { unawareDamageBonus: 0.15, detectionDelayBonus: 0.12 }, { maxRank: 3, branch: 'stealth', iconAnimation: 'badger_afterburn_icon' }),
    skill('rail_slide', 'Rail Slide', 'rocket', 3, 0, 2, ['gutter_ascension'], 'Slide cables and guardrails without losing sprint momentum.', { traversalSpeedBonus: 0.08, dodgeCooldownReduction: 0.025 }, { maxRank: 3, branch: 'climbing', iconAnimation: 'vector_kick_icon' }),
    skill('blind_corner', 'Blind Corner', 'rocket', 3, 2, 2, ['shadow_invoice'], 'Breaking sight at speed briefly drops pursuit.', { detectionDelayBonus: 0.16, stealthDurationBonus: 0.12 }, { maxRank: 3, branch: 'stealth', iconAnimation: 'fuel_sipper_icon' }),
    skill('vanishing_point', 'Vanishing Point', 'rocket', 4, 2, 3, ['blind_corner', 'rail_slide'], 'Climb and stealth routes converge in an aerial pursuit break.', { pursuitBreak: true, airControlBonus: 0.16 }, { branch: 'capstone', iconAnimation: 'communal_thrust_icon' }),
];
const HACKING_NODES = [
    skill('street_syntax', 'Street Syntax', 'hacking', 1, 1, 1, [], 'Forgive the first syntax error and reduce ambient trace.', { cortex: 1, firstHackMistakeIgnored: true, traceReduction: 0.05 }, { iconAnimation: 'street_syntax_icon' }),
    skill('black_ice_bite', 'Black Ice Bite', 'hacking', 2, 1, 2, ['street_syntax'], 'Successful code work charges the next close counter.', { hackChargesMelee: true, parryDamageBonus: 0.25 }, { iconAnimation: 'black_ice_bite_icon' }),
    skill('ghost_invoice', 'Ghost Invoice', 'hacking', 3, 1, 2, ['black_ice_bite'], 'Erase a larger share of accumulated trace.', { traceReduction: 0.2 }, { iconAnimation: 'ghost_invoice_icon' }),
    skill('remote_arc', 'Remote Arc', 'hacking', 4, 1, 3, ['ghost_invoice'], 'Route terminal charge into rail EMP payloads.', { empOnChargedShot: true, railDamageBonus: 0.15 }, { iconAnimation: 'remote_arc_icon' }),
    skill('public_exploit', 'Public Exploit', 'hacking', 5, 1, 4, ['remote_arc', 'root_collective'], 'Share the exploit: broad timing grace and a defensive checksum.', { beatGrace: 0.06, damageMitigation: 0.08, traceReduction: 0.1 }, { iconAnimation: 'public_exploit_icon' }),
    skill('packet_sense', 'Packet Sense', 'hacking', 1, 0, 1, [], 'Preview hostile daemon intent before the prompt resolves.', { beatGrace: 0.02, hackPreviewDepth: 1 }, { maxRank: 3, branch: 'infiltration', iconAnimation: 'street_syntax_icon' }),
    skill('daemon_leash', 'Daemon Leash', 'hacking', 1, 2, 1, [], 'Keep one captured process obedient for longer.', { daemonDurationBonus: 0.15, hackDamageBonus: 0.08 }, { maxRank: 3, branch: 'control', iconAnimation: 'black_ice_bite_icon' }),
    skill('zero_day_lullaby', 'Zero-Day Lullaby', 'hacking', 2, 0, 2, ['packet_sense'], 'Silence alarms during the first clean exploit window.', { traceReduction: 0.04, detectionDelayBonus: 0.08 }, { maxRank: 3, branch: 'infiltration', iconAnimation: 'ghost_invoice_icon' }),
    skill('camera_mutiny', 'Camera Mutiny', 'hacking', 2, 2, 2, ['daemon_leash'], 'Turn surveillance toward its owners.', { cameraHijackDuration: 0.4, criticalChanceBonus: 0.03 }, { maxRank: 3, branch: 'control', iconAnimation: 'remote_arc_icon' }),
    skill('checksum_forgery', 'Checksum Forgery', 'hacking', 3, 0, 2, ['zero_day_lullaby'], 'Failed probes look valid long enough to try again.', { firstHackMistakeIgnored: true, traceReduction: 0.05 }, { maxRank: 3, branch: 'infiltration', iconAnimation: 'ghost_invoice_icon' }),
    skill('turret_commune', 'Turret Commune', 'hacking', 3, 2, 2, ['camera_mutiny'], 'Hijacked defenses recognize a temporary collective.', { turretHijackDuration: 0.35, hackDamageBonus: 0.12 }, { maxRank: 3, branch: 'control', iconAnimation: 'remote_arc_icon' }),
    skill('root_collective', 'Root Collective', 'hacking', 4, 2, 3, ['turret_commune', 'checksum_forgery'], 'Infiltration and control merge into a persistent root route.', { remoteHack: true, traceReduction: 0.12, daemonDurationBonus: 0.3 }, { branch: 'capstone', iconAnimation: 'public_exploit_icon' }),
];
export const FIRST_RELEASE_SKILL_NODES = [
    ...CLAWLINE_NODES,
    ...BALLISTICS_NODES,
    ...GHOSTSTEP_NODES,
    ...HACKING_NODES,
];
function mergeEffect(target, key, value, rank) {
    const scaled = typeof value === 'number' ? value * rank : value;
    const previous = target[key];
    if (typeof scaled === 'number' && typeof previous === 'number')
        target[key] = previous + scaled;
    else if (typeof scaled === 'boolean' && typeof previous === 'boolean')
        target[key] = previous || scaled;
    else
        target[key] = scaled;
}
export function resolveSkillEffects(skillIds, skillRanks = {}) {
    const unlocked = new Set(skillIds);
    const effects = {};
    const trackRanks = {
        clawline: 0,
        railgun: 0,
        rocket: 0,
        hacking: 0,
    };
    for (const node of FIRST_RELEASE_SKILL_NODES) {
        if (!unlocked.has(node.id))
            continue;
        const rank = Math.max(1, Math.min(node.maxRank ?? 1, Math.floor(skillRanks[node.id] ?? 1)));
        if (node.track && node.track in trackRanks)
            trackRanks[node.track] += rank;
        for (const [key, value] of Object.entries(node.effects ?? {}))
            mergeEffect(effects, key, value, rank);
    }
    return { effects, trackRanks };
}
export class SkillTree {
    graph;
    constructor() {
        this.graph = {
            nodes: new Map(),
            attributes: { vigor: 0, sinew: 0, voltage: 0, velocity: 0, cortex: 0, bass: 0, guile: 0 },
            skillPoints: 0,
        };
        for (const node of FIRST_RELEASE_SKILL_NODES) {
            this.graph.nodes.set(node.id, {
                ...node,
                prereqs: [...node.prereqs],
                effects: { ...(node.effects ?? {}) },
                unlocked: false,
                rank: 0,
            });
        }
    }
    unlockNode(nodeId) {
        const node = this.graph.nodes.get(nodeId);
        if (!node || (node.rank ?? 0) >= (node.maxRank ?? 1))
            return false;
        const hasPrereqs = node.prereqs.every((prereqId) => (this.graph.nodes.get(prereqId)?.rank ?? 0) > 0);
        if (!hasPrereqs || this.graph.skillPoints < node.cost)
            return false;
        node.rank = (node.rank ?? 0) + 1;
        node.unlocked = true;
        this.graph.skillPoints -= node.cost;
        this.applySkillBonus(nodeId);
        return true;
    }
    canUnlock(nodeId) {
        const node = this.graph.nodes.get(nodeId);
        if (!node || (node.rank ?? 0) >= (node.maxRank ?? 1))
            return false;
        const hasPrereqs = node.prereqs.every((prereqId) => (this.graph.nodes.get(prereqId)?.rank ?? 0) > 0);
        return hasPrereqs && this.graph.skillPoints >= node.cost;
    }
    getAvailableNodes() {
        return [...this.graph.nodes.values()].filter((node) => this.canUnlock(node.id));
    }
    getUnlockedNodes() {
        return [...this.graph.nodes.values()].filter((node) => node.unlocked);
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
        if (skillId === 'claw_rush')
            this.graph.attributes.velocity += 1;
        if (skillId === 'rail_mastery')
            this.graph.attributes.voltage += 1;
        if (skillId === 'street_syntax')
            this.graph.attributes.cortex += 1;
    }
}
export function createSkillTree() {
    return new SkillTree();
}
export function hydrateSkillTree(purchasedSkills, skillRanks = {}) {
    const tree = createSkillTree();
    for (const skillId of purchasedSkills) {
        const node = tree.getNode(skillId);
        if (!node)
            continue;
        const rank = Math.max(1, Math.min(node.maxRank ?? 1, Math.floor(skillRanks[skillId] ?? 1)));
        for (let index = 0; index < rank; index += 1) {
            tree.addSkillPoints(node.cost);
            tree.unlockNode(skillId);
        }
    }
    return tree;
}
export function purchaseSkillWithMeta(tree, state, nodeId) {
    const node = tree.getNode(nodeId);
    if (!node)
        return { ok: false, state, reason: 'unknown-skill' };
    const rank = Math.max(node.rank ?? 0, state.skillRanks?.[nodeId] ?? (state.purchasedSkills.includes(nodeId) ? 1 : 0));
    if (rank >= (node.maxRank ?? 1))
        return { ok: false, state, reason: 'already-unlocked' };
    const hasPrerequisites = node.prereqs.every((prereqId) => (tree.getNode(prereqId)?.rank ?? 0) > 0 || state.purchasedSkills.includes(prereqId));
    if (!hasPrerequisites)
        return { ok: false, state, reason: 'missing-prerequisite' };
    if (state.blueprintShards < node.cost)
        return { ok: false, state, reason: 'insufficient-shards' };
    tree.addSkillPoints(node.cost);
    if (!tree.unlockNode(nodeId))
        return { ok: false, state, reason: 'missing-prerequisite' };
    const nextRank = rank + 1;
    return {
        ok: true,
        node: { ...node, rank: nextRank, unlocked: true },
        state: {
            ...state,
            blueprintShards: state.blueprintShards - node.cost,
            purchasedSkills: state.purchasedSkills.includes(nodeId)
                ? [...state.purchasedSkills]
                : [...state.purchasedSkills, nodeId],
            skillRanks: { ...(state.skillRanks ?? {}), [nodeId]: nextRank },
        },
    };
}
export { computeDerivedStats } from './derivedStats';
//# sourceMappingURL=SkillTree.js.map