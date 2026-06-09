import type { Rect } from '../types';
export interface MovingPlatformPathPoint {
    x: number;
    y: number;
    time: number;
}
export interface MovingPlatformState extends Rect {
    id: string;
    path: MovingPlatformPathPoint[];
    loop: boolean;
    time: number;
    vx: number;
    vy: number;
}
export interface CarriedBody extends Rect {
    id: string;
    vx: number;
    vy: number;
    onGround: boolean;
    standingOnId?: string;
}
export interface MovingPlatformStepResult<T extends CarriedBody> {
    platforms: MovingPlatformState[];
    bodies: T[];
    carryEvents: Array<{
        bodyId: string;
        platformId: string;
        dx: number;
        dy: number;
    }>;
}
export declare function stepMovingPlatforms<T extends CarriedBody>(platforms: readonly MovingPlatformState[], bodies: readonly T[], dt: number): MovingPlatformStepResult<T>;
//# sourceMappingURL=movingPlatformSystem.d.ts.map