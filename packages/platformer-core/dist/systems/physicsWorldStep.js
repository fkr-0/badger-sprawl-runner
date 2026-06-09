import { movementStep } from './movementStep';
import { gravityStep } from './gravityStep';
import { platformStep } from './platformStep';
import { coyoteStep } from './coyoteStep';
import { stepProjectiles } from './projectileStep';
import { applySurfaceMaterial } from './materialPhysics';
function cloneActor(actor) {
    return { ...actor };
}
function stepActor(actor, platforms, materialZones, params, dt) {
    const next = cloneActor(actor);
    if (next.axisInput !== 0)
        next.dir = Math.sign(next.axisInput);
    const actorParams = {
        ...params,
        maxFallSpeed: params.maxFallSpeed + (next.maxFallSpeedBonus ?? 0),
        runAccelAir: params.runAccelAir * (next.airControlMultiplier ?? 1),
    };
    if (next.jumpPressed)
        next.jumpBuffered = actorParams.jumpBuffer;
    const moved = movementStep({
        x: next.x,
        y: next.y,
        vx: next.vx,
        vy: next.vy,
        onGround: next.onGround,
        axisInput: next.axisInput,
        isFastFalling: next.fastFall,
        params: actorParams,
        dt,
    });
    Object.assign(next, moved);
    next.vy = gravityStep(next.vy, actorParams, dt);
    const canJump = next.onGround || next.coyoteLeft > 0;
    if (next.jumpBuffered > 0 && canJump) {
        next.vy = actorParams.jumpVelocity;
        next.onGround = false;
        next.coyoteLeft = 0;
        next.jumpBuffered = 0;
    }
    if (!next.jumpHeld && next.vy < actorParams.jumpVelocity * actorParams.variableJumpCut) {
        next.vy *= 0.52;
    }
    const landed = platformStep({
        x: next.x,
        y: next.y,
        w: next.w,
        h: next.h,
        vx: next.vx,
        vy: next.vy,
        prevVy: actor.vy,
        dt,
        platforms: [...platforms],
        coyoteTime: actorParams.coyote,
    });
    next.x = landed.x;
    next.y = landed.y;
    if (landed.onGround) {
        next.onGround = true;
        next.vy = 0;
        next.coyoteLeft = landed.coyoteLeft;
    }
    else {
        next.onGround = false;
    }
    const material = applySurfaceMaterial(next, materialZones, dt);
    Object.assign(next, material.body);
    const timers = coyoteStep({
        onGround: next.onGround,
        coyoteLeft: next.coyoteLeft,
        jumpBuffered: next.jumpBuffered,
        params: actorParams,
        dt,
    });
    next.coyoteLeft = timers.coyoteLeft;
    next.jumpBuffered = timers.jumpBuffered;
    next.jumpPressed = false;
    return {
        actor: next,
        materialEvent: material.contact
            ? {
                actorId: actor.id,
                materialId: material.contact.material.id,
                tags: [...(material.contact.material.tags ?? [])],
                damage: material.damage,
                overlapArea: material.contact.overlapArea,
            }
            : null,
    };
}
export function stepPhysicsWorld(input) {
    if (!Number.isFinite(input.dt) || input.dt < 0)
        throw new Error(`Invalid physics world dt: ${input.dt}`);
    const actorResults = input.world.actors.map((actor) => stepActor(actor, input.world.platforms, input.world.materialZones ?? [], input.params, input.dt));
    const actors = actorResults.map((result) => result.actor);
    const materialEvents = actorResults
        .map((result) => result.materialEvent)
        .filter((event) => event !== null);
    const projectileResult = stepProjectiles({
        projectiles: input.world.projectiles,
        targets: actors,
        platforms: input.world.platforms,
        bounds: input.world.bounds,
        fluid: input.fluid,
        params: input.params,
        dt: input.dt,
    });
    return {
        world: {
            ...input.world,
            actors,
            projectiles: projectileResult.projectiles,
            tick: input.world.tick + 1,
            time: input.world.time + input.dt,
        },
        projectileHits: projectileResult.hits,
        expiredProjectileIds: projectileResult.expiredIds,
        materialEvents,
    };
}
//# sourceMappingURL=physicsWorldStep.js.map