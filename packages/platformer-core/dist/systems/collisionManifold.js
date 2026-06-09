import { aabb } from './aabb';
function ordered(a, b) {
    return a.id <= b.id ? [a, b] : [b, a];
}
export function computeCollisionManifold(aBody, bBody) {
    const [a, b] = ordered(aBody, bBody);
    if (!aabb(a, b))
        return null;
    const aCenterX = a.x + a.w / 2;
    const aCenterY = a.y + a.h / 2;
    const bCenterX = b.x + b.w / 2;
    const bCenterY = b.y + b.h / 2;
    const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (overlapX <= 0 || overlapY <= 0)
        return null;
    if (overlapX < overlapY) {
        return {
            a: a.id,
            b: b.id,
            normalX: aCenterX <= bCenterX ? 1 : -1,
            normalY: 0,
            penetration: Number(overlapX.toFixed(6)),
            overlapX: Number(overlapX.toFixed(6)),
            overlapY: Number(overlapY.toFixed(6)),
        };
    }
    return {
        a: a.id,
        b: b.id,
        normalX: 0,
        normalY: aCenterY <= bCenterY ? 1 : -1,
        penetration: Number(overlapY.toFixed(6)),
        overlapX: Number(overlapX.toFixed(6)),
        overlapY: Number(overlapY.toFixed(6)),
    };
}
export function manifoldsFromSpatialPairs(pairs) {
    return pairs
        .map((pair) => computeCollisionManifold(pair.a, pair.b))
        .filter((manifold) => manifold !== null)
        .sort((left, right) => `${left.a}\u0000${left.b}`.localeCompare(`${right.a}\u0000${right.b}`));
}
//# sourceMappingURL=collisionManifold.js.map