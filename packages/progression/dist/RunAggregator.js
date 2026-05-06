/**
 * RunAggregator - accumulates in-run events into results screen data
 */
export class RunAggregator {
    current = {
        damageDealt: 0,
        damageTaken: 0,
        heatGained: 0,
        lootFound: 0,
        timeAlive: 0,
    };
    lootCollected = [];
    recordDamage(amount) {
        this.current.damageDealt += amount;
    }
    recordDamageTaken(amount) {
        this.current.damageTaken += amount;
    }
    recordHeat(delta) {
        this.current.heatGained += delta;
    }
    recordLoot(itemId) {
        this.lootCollected.push(itemId);
        this.current.lootFound++;
    }
    addTime(dt) {
        this.current.timeAlive += dt;
    }
    getCurrentRun() {
        return { ...this.current };
    }
    getLootCollected() {
        return [...this.lootCollected];
    }
    reset() {
        this.current = {
            damageDealt: 0,
            damageTaken: 0,
            heatGained: 0,
            lootFound: 0,
            timeAlive: 0,
        };
        this.lootCollected = [];
    }
    finalizeRun() {
        // Calculate rewards based on performance
        const credchips = Math.floor(this.current.damageDealt / 10) + this.lootCollected.length * 25;
        const blueprintShards = this.current.timeAlive > 300 ? 1 : 0;
        const dubFavor = Math.floor(this.current.damageDealt / 100);
        const orbitHeat = Math.floor(this.current.heatGained / 10);
        return {
            damageDealt: this.current.damageDealt,
            damageTaken: this.current.damageTaken,
            heatGained: this.current.heatGained,
            timeAlive: this.current.timeAlive,
            lootCollected: this.lootCollected,
            rewards: {
                credchips,
                blueprintShards,
                dubFavor,
                orbitHeat,
            },
        };
    }
}
export function createRunState() {
    return {
        damageDealt: 0,
        damageTaken: 0,
        heatGained: 0,
        lootFound: 0,
        timeAlive: 0,
    };
}
export function finalizeRun(run, lootCollected) {
    const credchips = Math.floor(run.damageDealt / 10) + lootCollected.length * 25;
    const blueprintShards = run.timeAlive > 300 ? 1 : 0;
    const dubFavor = Math.floor(run.damageDealt / 100);
    const orbitHeat = Math.floor(run.heatGained / 10);
    return {
        damageDealt: run.damageDealt,
        damageTaken: run.damageTaken,
        heatGained: run.heatGained,
        timeAlive: run.timeAlive,
        lootCollected,
        rewards: {
            credchips,
            blueprintShards,
            dubFavor,
            orbitHeat,
        },
    };
}
//# sourceMappingURL=RunAggregator.js.map