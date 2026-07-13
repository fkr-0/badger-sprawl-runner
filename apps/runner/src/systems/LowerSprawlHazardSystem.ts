import type { Player } from '../actors/MossBadger';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type LowerSprawlHazardState = 'idle' | 'warning' | 'active';

export interface LowerSprawlHazardDefinition {
	id: string;
	label: string;
	x: number;
	y: number;
	w: number;
	h: number;
	period: number;
	activeStart: number;
	activeDuration: number;
	warningDuration: number;
}

export interface LowerSprawlHazardSnapshot extends LowerSprawlHazardDefinition {
	state: LowerSprawlHazardState;
	stateRemaining: number;
}

export type LowerSprawlHazardEvent =
	| { kind: 'hazard-warning'; id: string }
	| { kind: 'hazard-active'; id: string }
	| { kind: 'hazard-hit'; id: string };

export const LOWER_SPRAWL_HAZARDS: readonly LowerSprawlHazardDefinition[] = [
	{
		id: 'west-steam-vent',
		label: 'West drain steam',
		x: 388,
		y: 426,
		w: 52,
		h: 68,
		period: 3.2,
		activeStart: 2.05,
		activeDuration: 0.62,
		warningDuration: 0.7,
	},
	{
		id: 'market-steam-vent',
		label: 'Market drain steam',
		x: 870,
		y: 426,
		w: 58,
		h: 68,
		period: 3.65,
		activeStart: 2.25,
		activeDuration: 0.72,
		warningDuration: 0.75,
	},
];

function stateAt(definition: LowerSprawlHazardDefinition, elapsed: number): LowerSprawlHazardState {
	const phase = elapsed % definition.period;
	if (
		phase >= definition.activeStart &&
		phase < definition.activeStart + definition.activeDuration
	) {
		return 'active';
	}
	if (
		phase >= definition.activeStart - definition.warningDuration &&
		phase < definition.activeStart
	) {
		return 'warning';
	}
	return 'idle';
}

function remainingAt(definition: LowerSprawlHazardDefinition, elapsed: number): number {
	const phase = elapsed % definition.period;
	const state = stateAt(definition, elapsed);
	if (state === 'active') return definition.activeStart + definition.activeDuration - phase;
	if (state === 'warning') return definition.activeStart - phase;
	const nextWarning = definition.activeStart - definition.warningDuration;
	return phase < nextWarning ? nextWarning - phase : definition.period - phase + nextWarning;
}

function hazardAttacker(definition: LowerSprawlHazardDefinition): CombatEntity {
	return {
		id: definition.id,
		x: definition.x,
		y: definition.y,
		w: definition.w,
		h: definition.h,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 1,
		maxHp: 1,
		invuln: 0,
		stun: 0,
		faction: 'enemy',
	};
}

export class LowerSprawlHazardSystem {
	private elapsed = 0;
	private readonly previousStates = new Map<string, LowerSprawlHazardState>();
	private readonly hitCooldowns = new Map<string, number>();

	constructor(private readonly definitions = LOWER_SPRAWL_HAZARDS) {
		for (const definition of definitions) this.previousStates.set(definition.id, 'idle');
	}

	step(
		player: Player,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): LowerSprawlHazardEvent[] {
		const safeDt = Math.max(0, dt);
		this.elapsed += safeDt;
		const events: LowerSprawlHazardEvent[] = [];

		for (const definition of this.definitions) {
			const state = stateAt(definition, this.elapsed);
			const previous = this.previousStates.get(definition.id) ?? 'idle';
			if (state !== previous) {
				if (state === 'warning') events.push({ kind: 'hazard-warning', id: definition.id });
				if (state === 'active') events.push({ kind: 'hazard-active', id: definition.id });
				this.previousStates.set(definition.id, state);
			}

			const cooldown = Math.max(0, (this.hitCooldowns.get(definition.id) ?? 0) - safeDt);
			this.hitCooldowns.set(definition.id, cooldown);
			if (state !== 'active' || cooldown > 0) continue;

			const resolution = combat.resolveAttack(
				hazardAttacker(definition),
				[player],
				{
					id: `${definition.id}:steam-burst`,
					source: 'enemy',
					damage: 1,
					damageType: 'burn',
					stun: 0.2,
					knockbackX: 35,
					knockbackY: -210,
					hitbox: {
						x: definition.x,
						y: definition.y,
						w: definition.w,
						h: definition.h,
					},
					parryable: false,
				},
				combatEvents
			);
			if (resolution.hits.length > 0) {
				this.hitCooldowns.set(definition.id, 0.85);
				events.push({ kind: 'hazard-hit', id: definition.id });
			}
		}

		return events;
	}

	getSnapshot(): LowerSprawlHazardSnapshot[] {
		return this.definitions.map((definition) => ({
			...definition,
			state: stateAt(definition, this.elapsed),
			stateRemaining: remainingAt(definition, this.elapsed),
		}));
	}
}
