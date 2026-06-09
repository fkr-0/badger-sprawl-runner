import type { Rect } from '../types';
export interface RaycastObstacle extends Rect {
    id: string;
    layer?: string;
}
export interface RaycastInput {
    x: number;
    y: number;
    dx: number;
    dy: number;
    maxDistance: number;
    obstacles: ReadonlyArray<RaycastObstacle>;
    includeLayers?: readonly string[];
}
export interface RaycastHit {
    obstacle: RaycastObstacle;
    distance: number;
    time: number;
    x: number;
    y: number;
    normalX: number;
    normalY: number;
}
export declare function raycast(input: RaycastInput): RaycastHit | null;
export declare function hasLineOfSight(input: RaycastInput): boolean;
//# sourceMappingURL=raycast.d.ts.map