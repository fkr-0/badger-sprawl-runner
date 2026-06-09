import type { Rect } from '../types';
import { type SweptObstacle } from './sweptAabb';
export interface KinematicBody extends Rect {
    id: string;
    vx: number;
    vy: number;
    onGround: boolean;
}
export interface KinematicMoveInput<T extends KinematicBody> {
    body: T;
    obstacles: ReadonlyArray<SweptObstacle>;
    dt: number;
    maxSlides?: number;
}
export interface KinematicCollision {
    obstacleId: string;
    normalX: number;
    normalY: number;
    time: number;
    remainingTime: number;
}
export interface KinematicMoveResult<T extends KinematicBody> {
    body: T;
    collisions: KinematicCollision[];
}
export declare function moveKinematicBody<T extends KinematicBody>(input: KinematicMoveInput<T>): KinematicMoveResult<T>;
//# sourceMappingURL=kinematicMotor.d.ts.map