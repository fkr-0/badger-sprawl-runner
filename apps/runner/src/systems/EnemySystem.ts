/**
 * EnemySystem - drives enemy state machines and AI
 */

import type { Entity } from './PhysicsSystem';
import type { CombatEntity } from './CombatSystem';

export type EnemyState = 'idle' | 'patrol' | 'alert' | 'windup' | 'attack' | 'recovery';

export interface Enemy extends CombatEntity {
	state: EnemyState;
	timer: number;
	target: Entity | null;
}

export class EnemySystem {
	step(enemies: Enemy[], player: Entity, dt: number): void {
		for (const enemy of enemies) {
			if (enemy.hp <= 0) continue;

			enemy.timer -= dt;

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
}
