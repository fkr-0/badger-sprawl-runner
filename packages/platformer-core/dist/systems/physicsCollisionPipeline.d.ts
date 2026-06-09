import { type SpatialBody } from './spatialIndex';
import { type CollisionManifold } from './collisionManifold';
import { type ImpulseBody, type ImpulseEvent } from './impulseCollision';
export interface CollisionPipelineBody extends SpatialBody, ImpulseBody {
}
export interface CollisionPipelineResult<T extends CollisionPipelineBody> {
    bodies: T[];
    manifolds: CollisionManifold[];
    impulses: ImpulseEvent[];
}
export declare function resolveCollisionPipeline<T extends CollisionPipelineBody>(bodies: readonly T[], cellSize: number): CollisionPipelineResult<T>;
//# sourceMappingURL=physicsCollisionPipeline.d.ts.map