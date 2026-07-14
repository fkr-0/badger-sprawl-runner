/**
 * EnemySystem - owns enemy lifecycle and drives enemy state machines / AI.
 */

import { defaultParams, gravityStep, platformStep } from '@badger/platformer-core';
import type { CombatEntity } from './CombatSystem';
import type { Entity } from './PhysicsSystem';

export type EnemyState = 'idle' | 'patrol' | 'alert' | 'windup' | 'attack' | 'recovery';
export type EnemyClass = 'crawler' | 'drone' | 'turret';

export type EnemyAiDef =
	| { kind: 'patrol'; patrolSpeed?: number; turnAtEdge?: boolean }
	| { kind: 'chase'; chaseSpeed?: number }
	| { kind: 'sine'; centerY: number; amplitude: number; frequency: number }
	| { kind: 'turret' };

export interface EnemyDef {
	id: string;
	class: EnemyClass;
	hp: number;
	speed: number;
	damage: number;
	stun: number;
	attackRange: number;
	attackCd: number;
	ai: EnemyAiDef;
}

export interface Enemy extends CombatEntity {
	state: EnemyState;
	timer: number;
	target: Entity | null;
}

export interface EnemyEntity extends Enemy {
	id: string;
	class: EnemyClass;
	defId: string;
	speed: number;
	damage: number;
	attackStun: number;
	attackRange: number;
	attackCd: number;
	ai: EnemyAiDef;
}

export class EnemySystem {
	private enemies: EnemyEntity[] = [];

	spawnEnemy(def: EnemyDef, x: number, y: number): EnemyEntity {
		const enemy: EnemyEntity = {
			id: def.id,
			defId: def.id,
			class: def.class,
			x,
			y,
			w: this.widthFor(def),
			h: this.heightFor(def),
			vx: this.initialVxFor(def),
			vy: 0,
			dir: -1,
			onGround: false,
			coyoteLeft: 0,
			jumpBuffered: 0,
			hp: def.hp,
			maxHp: def.hp,
			invuln: 0,
			stun: 0,
			faction: 'enemy',
			state: def.ai.kind === 'turret' ? 'idle' : 'patrol',
			timer: 0,
			target: null,
			speed: def.speed,
			damage: def.damage,
			attackStun: def.stun,
			attackRange: def.attackRange,
			attackCd: def.attackCd,
			ai: def.ai,
		};
		this.enemies.push(enemy);
		return enemy;
	}

	getEnemies(): EnemyEntity[] {
		this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
		return [...this.enemies];
	}

	clearEnemies(): void {
		this.enemies = [];
	}

	step(enemies: Enemy[], player: Entity, dt: number): void;
	step(
		enemies: Enemy[],
		player: Entity,
		platforms: Array<{ x: number; y: number; w: number; h: number }>,
		dt: number
	): void;
	step(
		enemies: Enemy[],
		player: Entity,
		platformsOrDt: Array<{ x: number; y: number; w: number; h: number }> | number,
		maybeDt?: number
	): void {
		const dt = typeof platformsOrDt === 'number' ? platformsOrDt : (maybeDt ?? 0);
		const platforms = Array.isArray(platformsOrDt) ? platformsOrDt : [];
		void player;

		for (const enemy of enemies) {
			if (enemy.hp <= 0) continue;

			enemy.timer -= dt;

			if (platforms.length > 0 && enemy.class !== 'drone') {
				enemy.vy = gravityStep(enemy.vy, defaultParams, dt);
				const prevVy = enemy.vy;
				enemy.y += enemy.vy * dt;

				const platform = platformStep({
					x: enemy.x,
					y: enemy.y,
					w: enemy.w,
					h: enemy.h,
					vx: enemy.vx,
					vy: enemy.vy,
					prevVy,
					dt,
					platforms,
					coyoteTime: defaultParams.coyote,
				});
				enemy.y = platform.y;
				if (platform.onGround) enemy.vy = 0;
				enemy.onGround = platform.onGround;
				enemy.coyoteLeft = platform.coyoteLeft;
			}

			switch (enemy.state) {
				case 'patrol':
					enemy.x += enemy.vx * dt;
					if (enemy.x < 560 || enemy.x > 760) enemy.vx *= -1;
					break;
				case 'attack':
					if (enemy.timer <= 0) {
						enemy.state = 'recovery';
						enemy.timer = 0.3;
					}
					break;
				case 'recovery':
					if (enemy.timer <= 0) {
						enemy.state = 'patrol';
					}
					break;
			}
		}
	}

	private initialVxFor(def: EnemyDef): number {
		if (def.class === 'turret') return 0;
		if (def.ai.kind === 'patrol' && def.ai.patrolSpeed !== undefined) return -def.ai.patrolSpeed;
		return -def.speed;
	}

	private widthFor(def: EnemyDef): number {
		switch (def.class) {
			case 'drone':
				return 34;
			case 'turret':
				return 44;
			case 'crawler':
				return 36;
		}
	}

	private heightFor(def: EnemyDef): number {
		switch (def.class) {
			case 'drone':
				return 28;
			case 'turret':
				return 46;
			case 'crawler':
				return 38;
		}
	}
}
