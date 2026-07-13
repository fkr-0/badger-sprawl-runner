import type { CombatEntity } from './CombatSystem';
import type { Entity } from './PhysicsSystem';

export interface StageCheckpointDefinition {
	id: string;
	label: string;
	x: number;
	y: number;
}

export interface StageCheckpointSnapshot {
	activeId: string;
	activeLabel: string;
	activeIndex: number;
	checkpoints: StageCheckpointDefinition[];
}

export type StageCheckpointEvent =
	| { kind: 'checkpoint-activated'; checkpoint: StageCheckpointDefinition }
	| { kind: 'player-respawned'; checkpoint: StageCheckpointDefinition };

export const LOWER_SPRAWL_CHECKPOINTS: readonly StageCheckpointDefinition[] = [
	{ id: 'sprawl-entry', label: 'Sprawl entry', x: 60, y: 448 },
	{ id: 'market-relay', label: 'Market relay', x: 820, y: 448 },
	{ id: 'toll-approach', label: 'Toll approach', x: 1320, y: 448 },
];

export class StageCheckpointSystem {
	private activeIndex = 0;

	constructor(private readonly checkpoints: readonly StageCheckpointDefinition[]) {
		if (checkpoints.length === 0) throw new Error('StageCheckpointSystem requires a checkpoint');
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

	respawn(player: Entity & Pick<CombatEntity, 'hp' | 'maxHp' | 'invuln' | 'stun'>): StageCheckpointEvent {
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

	private getActiveCheckpoint(): StageCheckpointDefinition {
		return this.checkpoints[this.activeIndex] as StageCheckpointDefinition;
	}
}
