import type { PhysicsParams } from '../PhysicsParams';
import type { FluidField, FlyingObjectState } from './flyingObjectStep';
import { type Rect } from './aabb';
export type ProjectileKind = 'scrap' | 'rail' | 'rocket' | 'fluid-drop' | 'melee-wave';
export interface ProjectileState extends FlyingObjectState {
    id: string;
    kind: ProjectileKind;
    ownerId: string;
    damage: number;
    pierce: number;
    active: boolean;
    bounces: number;
    maxBounces: number;
    tags: string[];
}
export interface ProjectileHit {
    projectileId: string;
    targetId: string;
    damage: number;
    kind: ProjectileKind;
}
export interface ProjectileStepInput {
    projectiles: ReadonlyArray<ProjectileState>;
    targets: ReadonlyArray<Rect & {
        id: string;
    }>;
    bounds: Rect;
    platforms?: ReadonlyArray<Rect>;
    fluid?: FluidField;
    params: Pick<PhysicsParams, 'gravity' | 'maxFallSpeed'>;
    dt: number;
}
export interface ProjectileStepOutput {
    projectiles: ProjectileState[];
    hits: ProjectileHit[];
    expiredIds: string[];
}
export declare function stepProjectiles(input: ProjectileStepInput): ProjectileStepOutput;
//# sourceMappingURL=projectileStep.d.ts.map