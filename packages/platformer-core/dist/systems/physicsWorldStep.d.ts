import type { PhysicsParams } from '../PhysicsParams';
import type { Rect } from '../types';
import type { DeterministicRngState } from './deterministicRng';
import type { FluidField } from './flyingObjectStep';
import { type ProjectileHit, type ProjectileState } from './projectileStep';
import { type MaterialZone } from './materialPhysics';
export interface PhysicsActorState extends Rect {
    id: string;
    vx: number;
    vy: number;
    dir: number;
    onGround: boolean;
    coyoteLeft: number;
    jumpBuffered: number;
    axisInput: number;
    jumpPressed: boolean;
    jumpHeld: boolean;
    fastFall: boolean;
    maxFallSpeedBonus?: number;
    airControlMultiplier?: number;
}
export interface PhysicsWorldState {
    actors: PhysicsActorState[];
    projectiles: ProjectileState[];
    platforms: Rect[];
    materialZones?: MaterialZone[];
    bounds: Rect;
    rng?: DeterministicRngState;
    tick: number;
    time: number;
}
export interface PhysicsWorldStepInput {
    world: PhysicsWorldState;
    params: PhysicsParams;
    dt: number;
    fluid?: FluidField;
}
export interface PhysicsMaterialEvent {
    actorId: string;
    materialId: string;
    tags: string[];
    damage: number;
    overlapArea: number;
}
export interface PhysicsWorldStepOutput {
    world: PhysicsWorldState;
    projectileHits: ProjectileHit[];
    expiredProjectileIds: string[];
    materialEvents: PhysicsMaterialEvent[];
}
export declare function stepPhysicsWorld(input: PhysicsWorldStepInput): PhysicsWorldStepOutput;
//# sourceMappingURL=physicsWorldStep.d.ts.map