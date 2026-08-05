import type { CombatEntity } from './CombatSystem';
import type { Entity } from './PhysicsSystem';

export interface StageCheckpointDefinition {
	id: string;
	label: string;
	x: number;
	y: number;
	resetPolicy?: StageCheckpointResetPolicy;
}

export interface StageCheckpointResetPolicy {
	id: 'story-continuity' | 'local-rehearsal' | 'boss-return';
	enemies: 'preserve-defeated' | 'restore-local-nonboss' | 'restore-boss';
	alarms: 'preserve-disabled' | 'rearm-local';
	civilians: 'preserve-state' | 'restore-local';
	objectives: 'preserve-progress';
	unbankedSalvageLossRate: number;
}

export interface ResolvedStageCheckpointDefinition
	extends Omit<StageCheckpointDefinition, 'resetPolicy'> {
	resetPolicy: StageCheckpointResetPolicy;
}

export const STORY_CONTINUITY_RESET_POLICY: StageCheckpointResetPolicy = Object.freeze({
	id: 'story-continuity',
	enemies: 'preserve-defeated',
	alarms: 'preserve-disabled',
	civilians: 'preserve-state',
	objectives: 'preserve-progress',
	unbankedSalvageLossRate: 0.5,
});

export interface StageCheckpointSnapshot {
	activeId: string;
	activeLabel: string;
	activeIndex: number;
	checkpoints: ResolvedStageCheckpointDefinition[];
}

export type StageCheckpointEvent =
	| { kind: 'checkpoint-activated'; checkpoint: ResolvedStageCheckpointDefinition }
	| { kind: 'player-respawned'; checkpoint: ResolvedStageCheckpointDefinition };

export const LOWER_SPRAWL_CHECKPOINTS: readonly StageCheckpointDefinition[] = [
	{ id: 'sprawl-entry', label: 'Sprawl entry', x: 60, y: 448 },
	{ id: 'market-relay', label: 'Market relay', x: 820, y: 448 },
	{ id: 'toll-approach', label: 'Toll approach', x: 1320, y: 448 },
];

export const MIRROR_PALACE_CHECKPOINTS: readonly StageCheckpointDefinition[] = [
	{ id: 'palace-foyer', label: 'Mirror foyer', x: 60, y: 448 },
	{ id: 'contract-gallery', label: 'Contract gallery', x: 980, y: 448 },
	{ id: 'banquet-approach', label: 'Banquet approach', x: 1780, y: 448 },
];

export const DUB_COLONY_CHECKPOINTS: readonly StageCheckpointDefinition[] = [
	{ id: 'greenhouse-car', label: 'Greenhouse car', x: 60, y: 448 },
	{ id: 'studio-temple', label: 'Studio temple', x: 1120, y: 448 },
	{ id: 'assembly-deck', label: 'Assembly deck', x: 2100, y: 448 },
];

export const CHROME_ARCOLOGY_CHECKPOINTS: readonly StageCheckpointDefinition[] = [
	{ id: 'arcology-lobby', label: 'Arcology lobby', x: 60, y: 448 },
	{ id: 'service-guts', label: 'Service guts', x: 920, y: 448 },
	{ id: 'seed-vault', label: 'Seed vault approach', x: 1700, y: 448 },
];

export const DRAINMARKET_CHECKPOINTS: readonly StageCheckpointDefinition[] = [
	{ id: 'drain-entry', label: 'Drainmarket entry', x: 60, y: 448 },
	{ id: 'clinic-crossing', label: 'Clinic crossing', x: 900, y: 448 },
	{ id: 'nest-approach', label: 'Nest approach', x: 1490, y: 448 },
];

export class StageCheckpointSystem {
	private activeIndex = 0;
	private readonly checkpoints: ResolvedStageCheckpointDefinition[];

	constructor(checkpoints: readonly StageCheckpointDefinition[]) {
		if (checkpoints.length === 0) throw new Error('StageCheckpointSystem requires a checkpoint');
		this.checkpoints = checkpoints.map((checkpoint) => ({
			...checkpoint,
			resetPolicy: resolveCheckpointResetPolicy(checkpoint.resetPolicy),
		}));
	}

	step(playerX: number): StageCheckpointEvent[] {
		let nextIndex = this.activeIndex;
		for (let index = this.activeIndex + 1; index < this.checkpoints.length; index += 1) {
			const checkpoint = this.checkpoints[index];
			if (checkpoint && playerX >= checkpoint.x) nextIndex = index;
		}
		if (nextIndex === this.activeIndex) return [];
		this.activeIndex = nextIndex;
		return [{ kind: 'checkpoint-activated', checkpoint: { ...this.getActiveCheckpoint() } }];
	}

	respawn(
		player: Entity & Pick<CombatEntity, 'hp' | 'maxHp' | 'invuln' | 'stun'>
	): StageCheckpointEvent {
		const checkpoint = this.getActiveCheckpoint();
		player.x = checkpoint.x;
		player.y = checkpoint.y;
		player.vx = 0;
		player.vy = 0;
		player.hp = player.maxHp;
		player.invuln = Math.max(player.invuln, 1.2);
		player.stun = 0;
		player.onGround = true;
		player.coyoteLeft = 0;
		player.jumpBuffered = 0;
		return { kind: 'player-respawned', checkpoint: { ...checkpoint } };
	}

	getSnapshot(): StageCheckpointSnapshot {
		const active = this.getActiveCheckpoint();
		return {
			activeId: active.id,
			activeLabel: active.label,
			activeIndex: this.activeIndex,
			checkpoints: this.checkpoints.map((checkpoint) => ({ ...checkpoint })),
		};
	}

	private getActiveCheckpoint(): ResolvedStageCheckpointDefinition {
		return this.checkpoints[this.activeIndex] as ResolvedStageCheckpointDefinition;
	}
}

export function resolveCheckpointResetPolicy(
	policy: StageCheckpointResetPolicy | undefined
): StageCheckpointResetPolicy {
	if (!policy) return { ...STORY_CONTINUITY_RESET_POLICY };
	return {
		...policy,
		unbankedSalvageLossRate: Math.min(
			1,
			Math.max(0, Number.isFinite(policy.unbankedSalvageLossRate) ? policy.unbankedSalvageLossRate : 0.5)
		),
	};
}
