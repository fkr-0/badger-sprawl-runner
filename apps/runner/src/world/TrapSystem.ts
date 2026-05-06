/**
 * TrapSystem - manages trap ownership and state
 */

export type TrapState = 'hostile' | 'neutral' | 'hacked' | 'unstable';

export interface Trap {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'camera' | 'door' | 'turret' | 'terminal';
  state: TrapState;
  tier: number;
  owner: 'player' | 'enemy' | 'none';
}

export class TrapSystem {
  private traps: Map<string, Trap> = new Map();

  registerTrap(trap: Trap): void {
    this.traps.set(trap.id, trap);
  }

  getTrap(id: string): Trap | undefined {
    return this.traps.get(id);
  }

  updateTrap(id: string, updates: Partial<Trap>): boolean {
    const trap = this.traps.get(id);
    if (!trap) return false;

    Object.assign(trap, updates);
    return true;
  }

  hackTrap(id: string): boolean {
    const trap = this.traps.get(id);
    if (!trap) return false;

    // Higher tier traps have hack resistance
    if (trap.tier > 1 && Math.random() > 0.7) {
      trap.state = 'unstable';
      return false;
    }

    trap.state = 'hacked';
    trap.owner = 'player';
    return true;
  }

  triggerTrap(id: string): boolean {
    const trap = this.traps.get(id);
    if (!trap) return false;

    // Traps behave based on ownership
    switch (trap.state) {
      case 'hostile':
        // Harm player
        return true;

      case 'hacked':
        // Benefit player
        return true;

      case 'neutral':
        // Do nothing
        return false;

      case 'unstable':
        // Random effect
        return Math.random() > 0.5;

      default:
        return false;
    }
  }

  getTrapsInRect(x: number, y: number, w: number, h: number): Trap[] {
    const results: Trap[] = [];

    for (const trap of this.traps.values()) {
      if (
        trap.x < x + w &&
        trap.x + trap.w > x &&
        trap.y < y + h &&
        trap.y + trap.h > y
      ) {
        results.push(trap);
      }
    }

    return results;
  }

  getAllTraps(): Trap[] {
    return Array.from(this.traps.values());
  }

  clear(): void {
    this.traps.clear();
  }
}
