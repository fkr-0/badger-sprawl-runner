import { flyingObjectStep } from './flyingObjectStep';
import { aabb } from './aabb';
function projectileRect(projectile) {
    const radius = projectile.radius ?? 4;
    return {
        x: projectile.x - radius,
        y: projectile.y - radius,
        w: radius * 2,
        h: radius * 2,
    };
}
function intersectsAnyPlatform(projectile, platforms) {
    const rect = projectileRect(projectile);
    return platforms.find((platform) => aabb(rect, platform)) ?? null;
}
function insideBounds(projectile, bounds) {
    return aabb(projectileRect(projectile), bounds);
}
function bounceOffPlatform(projectile, platform) {
    const rect = projectileRect(projectile);
    const overlapLeft = rect.x + rect.w - platform.x;
    const overlapRight = platform.x + platform.w - rect.x;
    const overlapTop = rect.y + rect.h - platform.y;
    const overlapBottom = platform.y + platform.h - rect.y;
    const minHorizontal = Math.min(overlapLeft, overlapRight);
    const minVertical = Math.min(overlapTop, overlapBottom);
    if (minHorizontal < minVertical) {
        return {
            ...projectile,
            x: overlapLeft < overlapRight ? platform.x - rect.w / 2 : platform.x + platform.w + rect.w / 2,
            vx: -projectile.vx * 0.62,
            bounces: projectile.bounces + 1,
        };
    }
    return {
        ...projectile,
        y: overlapTop < overlapBottom ? platform.y - rect.h / 2 : platform.y + platform.h + rect.h / 2,
        vy: -projectile.vy * 0.62,
        bounces: projectile.bounces + 1,
    };
}
export function stepProjectiles(input) {
    if (!Number.isFinite(input.dt) || input.dt < 0)
        throw new Error(`Invalid projectile dt: ${input.dt}`);
    const hits = [];
    const expiredIds = [];
    const projectiles = [];
    for (const projectile of input.projectiles) {
        if (!projectile.active)
            continue;
        let next = {
            ...projectile,
            ...flyingObjectStep({
                object: projectile,
                params: input.params,
                dt: input.dt,
                fluid: input.fluid,
                gravityScale: projectile.kind === 'rail' ? 0 : projectile.kind === 'rocket' ? 0.15 : 1,
            }),
        };
        const platform = intersectsAnyPlatform(next, input.platforms ?? []);
        if (platform)
            next = bounceOffPlatform(next, platform);
        let pierceLeft = next.pierce;
        for (const target of input.targets) {
            if (target.id === next.ownerId || !aabb(projectileRect(next), target))
                continue;
            hits.push({ projectileId: next.id, targetId: target.id, damage: next.damage, kind: next.kind });
            pierceLeft -= 1;
            if (pierceLeft < 0)
                break;
        }
        next = { ...next, pierce: pierceLeft };
        const alive = insideBounds(next, input.bounds) && (next.life ?? 1) > 0 && next.bounces <= next.maxBounces && next.pierce >= 0;
        if (alive)
            projectiles.push(next);
        else
            expiredIds.push(next.id);
    }
    return { projectiles, hits, expiredIds };
}
//# sourceMappingURL=projectileStep.js.map