/**
 * BoonPool - manages active boons and tag-based queries
 */
export class BoonPool {
    active = [];
    add(boon) {
        // Don't add duplicates
        if (!this.active.some(b => b.id === boon.id)) {
            this.active.push(boon);
        }
    }
    remove(boonId) {
        this.active = this.active.filter(b => b.id !== boonId);
    }
    has(boonId) {
        return this.active.some(b => b.id === boonId);
    }
    hasTag(tag) {
        return this.active.some(b => b.tags.includes(tag));
    }
    query(tag) {
        return this.active.filter(b => b.tags.includes(tag));
    }
    queryMultiple(tags) {
        return this.active.filter(b => tags.every(tag => b.tags.includes(tag)));
    }
    getAll() {
        return [...this.active];
    }
    clear() {
        this.active = [];
    }
    getCount() {
        return this.active.length;
    }
}
export function createBoonPool() {
    return new BoonPool();
}
// Predefined boons from the game
export const PREDEFINED_BOONS = {
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
//# sourceMappingURL=BoonPool.js.map