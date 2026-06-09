export type SnapshotValue = null | boolean | number | string | SnapshotValue[] | {
    [key: string]: SnapshotValue | undefined;
};
export interface SnapshotHashOptions {
    precision?: number;
    ignoreKeys?: readonly string[];
}
export declare function stableSnapshot(value: SnapshotValue, options?: SnapshotHashOptions): SnapshotValue;
export declare function stableSnapshotString(value: SnapshotValue, options?: SnapshotHashOptions): string;
export declare function fnv1a32(input: string): string;
export declare function deterministicHash(value: SnapshotValue, options?: SnapshotHashOptions): string;
//# sourceMappingURL=deterministicSnapshot.d.ts.map