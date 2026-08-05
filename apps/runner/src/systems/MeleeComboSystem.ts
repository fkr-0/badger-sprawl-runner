import { aabb } from '@badger/platformer-core';
import type { CombatEntity, CombatEvents } from './CombatSystem';
import type { Entity } from './PhysicsSystem';
import { resolveEliteLoopResistance } from './EliteLoopResistanceSystem';

export type MeleeInput = 'light' | 'heavy' | 'launcher' | 'air' | 'finisher';

export interface MeleeMove {
	id: string;
	input: MeleeInput;
	label: string;
	damage: number;
	stun: number;
	knockbackX: number;
	knockbackY: number;
	hitbox: { x: number; y: number; w: number; h: number };
	chainsTo: string[];
	requiresAirborne?: boolean;
	requiresSkill?: string;
	comboWindow: number;
	styleGain: number;
}

export interface MeleeComboState {
	activeMoveId: string | null;
	queuedInput: MeleeInput | null;
	comboTimer: number;
	chainDepth: number;
	style: number;
	unlockedSkills: string[];
}

export interface MeleeAttackResult {
	move: MeleeMove;
	hits: Array<{ enemy: CombatEntity; damage: number; killed: boolean }>;
	state: MeleeComboState;
}

export const STARTER_MOVE_IDS = ['claw_jab', 'claw_heavy'] as const;

export const MELEE_MOVES: Record<string, MeleeMove> = {
	claw_jab: {
		id: 'claw_jab',
		input: 'light',
		label: 'Claw Jab',
		damage: 1,
		stun: 0.28,
		knockbackX: 90,
		knockbackY: 0,
		hitbox: { x: 26, y: 8, w: 38, h: 28 },
		chainsTo: ['claw_cross', 'burrow_launcher'],
		comboWindow: 0.42,
		styleGain: 1,
	},
	claw_cross: {
		id: 'claw_cross',
		input: 'light',
		label: 'Claw Cross',
		damage: 1.25,
		stun: 0.34,
		knockbackX: 120,
		knockbackY: 0,
		hitbox: { x: 30, y: 6, w: 46, h: 30 },
		chainsTo: ['tail_hook', 'invoice_splitter'],
		requiresSkill: 'double_swipe',
		comboWindow: 0.46,
		styleGain: 1,
	},
	tail_hook: {
		id: 'tail_hook',
		input: 'heavy',
		label: 'Tail Hook',
		damage: 1.75,
		stun: 0.45,
		knockbackX: 170,
		knockbackY: -90,
		hitbox: { x: 20, y: 4, w: 58, h: 36 },
		chainsTo: ['invoice_splitter'],
		comboWindow: 0.5,
		styleGain: 2,
	},
	burrow_launcher: {
		id: 'burrow_launcher',
		input: 'launcher',
		label: 'Burrow Launcher',
		damage: 1.5,
		stun: 0.5,
		knockbackX: 70,
		knockbackY: -320,
		hitbox: { x: 22, y: -12, w: 44, h: 58 },
		chainsTo: ['air_rake'],
		comboWindow: 0.55,
		styleGain: 2,
	},
	air_rake: {
		id: 'air_rake',
		input: 'air',
		label: 'Air Rake',
		damage: 1.5,
		stun: 0.42,
		knockbackX: 130,
		knockbackY: 80,
		hitbox: { x: 24, y: 0, w: 52, h: 38 },
		chainsTo: ['invoice_splitter'],
		requiresAirborne: true,
		comboWindow: 0.48,
		styleGain: 2,
	},
	invoice_splitter: {
		id: 'invoice_splitter',
		input: 'finisher',
		label: 'Invoice Splitter',
		damage: 3,
		stun: 0.7,
		knockbackX: 260,
		knockbackY: -120,
		hitbox: { x: 18, y: 0, w: 66, h: 42 },
		chainsTo: [],
		requiresSkill: 'parry_tooth',
		comboWindow: 0.1,
		styleGain: 4,
	},
	claw_heavy: {
		id: 'claw_heavy',
		input: 'heavy',
		label: 'Opening Heavy',
		damage: 1.4,
		stun: 0.4,
		knockbackX: 150,
		knockbackY: 0,
		hitbox: { x: 24, y: 6, w: 54, h: 34 },
		chainsTo: ['invoice_splitter'],
		comboWindow: 0.44,
		styleGain: 1,
	},
};

export function createMeleeComboState(unlockedSkills: readonly string[] = []): MeleeComboState {
	return {
		activeMoveId: null,
		queuedInput: null,
		comboTimer: 0,
		chainDepth: 0,
		style: 0,
		unlockedSkills: [...unlockedSkills],
	};
}

export function decayMeleeCombo(state: MeleeComboState, dt: number): MeleeComboState {
	const comboTimer = Math.max(0, state.comboTimer - dt);
	return {
		...state,
		comboTimer,
		activeMoveId: comboTimer === 0 ? null : state.activeMoveId,
		chainDepth: comboTimer === 0 ? 0 : state.chainDepth,
	};
}

export function resolveNextMeleeMove(
	state: MeleeComboState,
	input: MeleeInput,
	player: Pick<Entity, 'onGround'>
): MeleeMove | null {
	const candidates =
		state.activeMoveId && state.comboTimer > 0
			? (MELEE_MOVES[state.activeMoveId]?.chainsTo ?? [])
			: [...STARTER_MOVE_IDS];

	for (const moveId of candidates) {
		const move = MELEE_MOVES[moveId];
		if (!move || move.input !== input) continue;
		if (move.requiresAirborne && player.onGround) continue;
		if (move.requiresSkill && !state.unlockedSkills.includes(move.requiresSkill)) continue;
		return move;
	}

	return null;
}

function worldHitbox(player: Pick<Entity, 'x' | 'y' | 'w' | 'dir'>, move: MeleeMove) {
	return {
		x:
			player.dir >= 0
				? player.x + player.w + move.hitbox.x - 26
				: player.x - move.hitbox.x - move.hitbox.w + 26,
		y: player.y + move.hitbox.y,
		w: move.hitbox.w,
		h: move.hitbox.h,
	};
}

export class MeleeComboSystem {
	constructor(private state: MeleeComboState = createMeleeComboState()) {}

	getState(): MeleeComboState {
		return { ...this.state, unlockedSkills: [...this.state.unlockedSkills] };
	}

	setUnlockedSkills(skillIds: readonly string[]): void {
		this.state.unlockedSkills = [...skillIds];
	}

	step(dt: number): void {
		this.state = decayMeleeCombo(this.state, dt);
	}

	attack(
		player: Entity,
		enemies: CombatEntity[],
		input: MeleeInput,
		events?: CombatEvents,
		time = 0
	): MeleeAttackResult | null {
		const move = resolveNextMeleeMove(this.state, input, player);
		if (!move) return null;

		const hitbox = worldHitbox(player, move);
		const hits: MeleeAttackResult['hits'] = [];

		for (const enemy of enemies) {
			if (enemy.hp <= 0 || enemy.invuln > 0 || !aabb(hitbox, enemy)) continue;
			enemy.hp -= move.damage;
			const loopResistance = resolveEliteLoopResistance(
				enemy,
				move.id,
				time,
				move.stun,
				move.damage
			);
			enemy.stun = Math.max(enemy.stun, loopResistance.stun);
			enemy.vx += player.dir * move.knockbackX;
			enemy.vy += move.knockbackY;
			if (loopResistance.resisted) {
				events?.onEvent?.({
					kind: 'loop-resisted',
					source: 'player',
					targetId: enemy.id,
					time,
					moveId: move.id,
					repeatCount: loopResistance.repeatCount,
					stunScale: loopResistance.stunScale,
					poiseScale: loopResistance.poiseScale,
				});
			}
			hits.push({ enemy, damage: move.damage, killed: enemy.hp <= 0 });
			events?.onEvent?.({
				kind: enemy.hp <= 0 ? 'kill' : 'hit',
				source: 'player',
				targetId: enemy.id,
				damage: move.damage,
				moveId: move.id,
				combo: this.state.chainDepth + 1,
			});
		}

		this.state = {
			...this.state,
			activeMoveId: move.id,
			queuedInput: null,
			comboTimer: move.comboWindow,
			chainDepth: this.state.comboTimer > 0 ? this.state.chainDepth + 1 : 1,
			style: this.state.style + move.styleGain * Math.max(1, hits.length),
		};

		if (hits.length > 0) {
			events?.requestHitstop?.(Math.min(0.16, 0.035 + this.state.chainDepth * 0.018));
			events?.requestScreenShake?.(Math.min(12, 3 + this.state.chainDepth * 2));
		}

		return { move, hits, state: this.getState() };
	}
}
