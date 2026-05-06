/**
 * BoonPool - manages active boons and tag-based queries
 */
import type { Boon } from './types';
export declare class BoonPool {
    private active;
    add(boon: Boon): void;
    remove(boonId: string): void;
    has(boonId: string): boolean;
    hasTag(tag: string): boolean;
    query(tag: string): Boon[];
    queryMultiple(tags: string[]): Boon[];
    getAll(): Boon[];
    clear(): void;
    getCount(): number;
}
export declare function createBoonPool(): BoonPool;
export declare const PREDEFINED_BOONS: Record<string, Omit<Boon, 'id'>>;
//# sourceMappingURL=BoonPool.d.ts.map