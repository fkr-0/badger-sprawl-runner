/**
 * TrainingDummy - invincible damage test target
 */

import type { CombatEntity } from '../systems/CombatSystem';
import type { Entity } from '../systems/PhysicsSystem';

export interface TrainingDummy extends Entity, CombatEntity {
  isDummy: true;
  flashtimer: number;
  lastHitTime: number;
}

export function createTrainingDummy(x: number, y: number): TrainingDummy {
  return {
    x,
    y,
    w: 40,
    h: 50,
    vx: 0,
    vy: 0,
    dir: 1,
    onGround: true,
    coyoteLeft: 0,
    jumpBuffered: 0,

    // Combat properties
    hp: Number.POSITIVE_INFINITY,
    maxHp: Number.POSITIVE_INFINITY,
    invuln: 0,
    stun: 0,

    // Dummy-specific
    isDummy: true,
    flashtimer: 0,
    lastHitTime: 0,
  };
}

export function processTrainingDummy(dummy: TrainingDummy, dt: number): void {
  // Decay flash timer
  dummy.flashtimer = Math.max(0, dummy.flashtimer - dt);
  dummy.invuln = Math.max(0, dummy.invuln - dt);
  dummy.stun = Math.max(0, dummy.stun - dt);

  // Keep dummy grounded
  dummy.vy = 0;
  dummy.vx = 0;
}

export function hitTrainingDummy(dummy: TrainingDummy): void {
  dummy.flashtimer = 0.15;
  dummy.lastHitTime = Date.now();
  dummy.stun = 0.2;
}
