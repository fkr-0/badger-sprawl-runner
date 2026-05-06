/**
 * Item system: active/passive items, cooldowns
 */

import type { ActionMap } from './InputSystem';
import type { Entity } from './PhysicsSystem';

export interface Pickup {
  id: string;
  x: number;
  y: number;
  kind: string;
  taken: boolean;
}

export class ItemSystem {
  step(player: Entity, action: ActionMap, pickups: Pickup[], dt: number): void {
    for (const pickup of pickups) {
      if (pickup.taken) continue;

      const dx = player.x + player.w / 2 - pickup.x - 14;
      const dy = player.y + player.h / 2 - pickup.y - 14;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30) {
        pickup.taken = true;
        this.collect(player, pickup);
      }
    }
  }

  private collect(player: Entity, pickup: Pickup): void {
    switch (pickup.kind) {
      case 'rocket':
        player.hasRocket = true;
        break;
      case 'railgun':
        player.hasRailgun = true;
        break;
      case 'katana':
        player.hasKatana = true;
        break;
      case 'stim':
        player.stims++;
        break;
    }
  }
}
