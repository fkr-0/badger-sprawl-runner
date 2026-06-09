import type { Rect } from '../types';
export interface SweptObstacle extends Rect {
    id: string;
    oneWay?: boolean;
}
export interface SweepInput {
    body: Rect;
    vx: number;
    vy: number;
    dt: number;
    obstacles: ReadonlyArray<SweptObstacle>;
}
export interface SweepHit {
    obstacle: SweptObstacle;
    time: number;
    normalX: number;
    normalY: number;
    remainingTime: number;
}
export interface SweepResult {
    x: number;
    y: number;
    vx: number;
    vy: number;
    hit: SweepHit | null;
}
export declare function sweepAabb(input: SweepInput): SweepResult;
//# sourceMappingURL=sweptAabb.d.ts.map