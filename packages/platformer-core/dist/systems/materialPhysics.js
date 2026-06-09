import { aabb } from './aabb';
export const DEFAULT_SURFACE_MATERIAL = {
    id: 'concrete',
    friction: 1,
    traction: 1,
    restitution: 0,
    conveyorX: 0,
    conveyorY: 0,
    damagePerSecond: 0,
    tags: ['solid'],
};
function overlapArea(a, b) {
    const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return x * y;
}
export function sampleMaterialContact(body, zones) {
    let best = null;
    for (const zone of zones) {
        if (!aabb(body, zone))
            continue;
        const area = overlapArea(body, zone);
        if (area <= 0)
            continue;
        const priority = zone.priority ?? 0;
        const bestPriority = best?.zone.priority ?? 0;
        if (!best || priority > bestPriority || (priority === bestPriority && area > best.overlapArea)) {
            best = { material: zone.material, zone, overlapArea: area };
        }
    }
    return best;
}
export function applySurfaceMaterial(body, zones, dt, fallback = DEFAULT_SURFACE_MATERIAL) {
    if (!Number.isFinite(dt) || dt < 0)
        throw new Error(`Invalid material dt: ${dt}`);
    const contact = sampleMaterialContact(body, zones);
    const material = contact?.material ?? fallback;
    let vx = body.vx;
    let vy = body.vy;
    if (body.onGround) {
        const frictionFactor = Math.max(0, 1 - Math.max(0, material.friction) * dt);
        vx *= frictionFactor;
        vx += (material.conveyorX ?? 0) * dt;
        vy += (material.conveyorY ?? 0) * dt;
    }
    if (material.restitution > 0 && body.vy > 0 && contact) {
        vy = -Math.abs(body.vy) * Math.min(1, material.restitution);
    }
    const damage = Math.max(0, material.damagePerSecond ?? 0) * dt;
    return {
        body: { ...body, vx, vy },
        contact,
        damage,
    };
}
export function materialHasTag(material, tag) {
    return Boolean(material.tags?.includes(tag));
}
//# sourceMappingURL=materialPhysics.js.map