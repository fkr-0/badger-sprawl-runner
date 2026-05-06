/**
 * Helper function for computing derived stats from attributes
 */

import type { DerivedStats } from './types';

export function computeDerivedStats(attrs: {
  vigor?: number;
  sinew?: number;
  voltage?: number;
  velocity?: number;
  cortex?: number;
  bass?: number;
  guile?: number;
}): DerivedStats {
  const { vigor = 0, sinew = 0, voltage = 0, velocity: vel = 0, cortex = 0, bass = 0, guile = 0 } = attrs;

  return {
    hp: 5 + vigor * 2,
    rallyWindow: 1.2,
    clawDamage: 1 + sinew * 0.5,
    katanaDamage: 2 + sinew * 0.75,
    railDamage: 3 + voltage * 0.5,
    maxSpeed: 285 + vel * 10,
    hackTimeBonus: 0.8 - cortex * 0.05,
    shopDiscount: Math.min(0.3, guile * 0.02),
    companionSyncRate: 0.5 + bass * 0.1,
  };
}
