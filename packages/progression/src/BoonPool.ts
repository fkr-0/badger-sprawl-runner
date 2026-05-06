/**
 * BoonPool - manages active boons and tag-based queries
 */

import type { Boon } from './types';

export class BoonPool {
  private active: Boon[] = [];

  add(boon: Boon): void {
    // Don't add duplicates
    if (!this.active.some(b => b.id === boon.id)) {
      this.active.push(boon);
    }
  }

  remove(boonId: string): void {
    this.active = this.active.filter(b => b.id !== boonId);
  }

  has(boonId: string): boolean {
    return this.active.some(b => b.id === boonId);
  }

  hasTag(tag: string): boolean {
    return this.active.some(b => b.tags.includes(tag));
  }

  query(tag: string): Boon[] {
    return this.active.filter(b => b.tags.includes(tag));
  }

  queryMultiple(tags: string[]): Boon[] {
    return this.active.filter(b => tags.every(tag => b.tags.includes(tag)));
  }

  getAll(): Boon[] {
    return [...this.active];
  }

  clear(): void {
    this.active = [];
  }

  getCount(): number {
    return this.active.length;
  }
}

export function createBoonPool(): BoonPool {
  return new BoonPool();
}

// Predefined boons from the game
export const PREDEFINED_BOONS: Record<string, Omit<Boon, 'id'>> = {
  dub_shield: {
    name: 'Dub Shield',
    tags: ['beat', 'defense'],
    effectCode: 'absorb_on_beat',
  },

  bassline_boots: {
    name: 'Bassline Boots',
    tags: ['beat', 'movement'],
    effectCode: 'shockwave_on_beat_land',
  },

  street_senses: {
    name: 'Street Senses',
    tags: ['hack', 'passive'],
    effectCode: 'extended_hack_range',
  },

  remote_tap: {
    name: 'Remote Tap',
    tags: ['hack', 'active'],
    effectCode: 'remote_door_open',
  },

  tempo_charge: {
    name: 'Tempo Charge',
    tags: ['beat', 'damage'],
    effectCode: 'combo_damage_boost',
  },
};
