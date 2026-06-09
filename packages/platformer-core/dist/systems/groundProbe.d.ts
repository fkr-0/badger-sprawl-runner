import type { Rect } from '../types';
import { type RaycastObstacle } from './raycast';
export interface GroundProbeInput {
    body: Rect;
    probeDistance: number;
    obstacles: ReadonlyArray<RaycastObstacle>;
    probeInset?: number;
}
export interface GroundProbeHit {
    grounded: boolean;
    distance: number;
    normalX: number;
    normalY: number;
    obstacleId?: string;
}
export declare function probeGround(input: GroundProbeInput): GroundProbeHit;
//# sourceMappingURL=groundProbe.d.ts.map