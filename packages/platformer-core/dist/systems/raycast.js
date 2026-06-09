function normalize(dx, dy) {
    const length = Math.hypot(dx, dy);
    if (length === 0)
        throw new Error('Cannot raycast with a zero direction');
    return { x: dx / length, y: dy / length };
}
function rayAabb(input, obstacle, nx, ny) {
    const invX = nx === 0 ? Number.POSITIVE_INFINITY : 1 / nx;
    const invY = ny === 0 ? Number.POSITIVE_INFINITY : 1 / ny;
    let t1 = (obstacle.x - input.x) * invX;
    let t2 = (obstacle.x + obstacle.w - input.x) * invX;
    let t3 = (obstacle.y - input.y) * invY;
    let t4 = (obstacle.y + obstacle.h - input.y) * invY;
    if (nx === 0) {
        if (input.x < obstacle.x || input.x > obstacle.x + obstacle.w)
            return null;
        t1 = Number.NEGATIVE_INFINITY;
        t2 = Number.POSITIVE_INFINITY;
    }
    if (ny === 0) {
        if (input.y < obstacle.y || input.y > obstacle.y + obstacle.h)
            return null;
        t3 = Number.NEGATIVE_INFINITY;
        t4 = Number.POSITIVE_INFINITY;
    }
    const tMinX = Math.min(t1, t2);
    const tMaxX = Math.max(t1, t2);
    const tMinY = Math.min(t3, t4);
    const tMaxY = Math.max(t3, t4);
    const tEnter = Math.max(tMinX, tMinY);
    const tExit = Math.min(tMaxX, tMaxY);
    if (tEnter > tExit || tExit < 0 || tEnter > input.maxDistance)
        return null;
    const distance = Math.max(0, tEnter);
    let normalX = 0;
    let normalY = 0;
    if (tMinX > tMinY)
        normalX = nx > 0 ? -1 : 1;
    else
        normalY = ny > 0 ? -1 : 1;
    return {
        obstacle,
        distance: Number(distance.toFixed(6)),
        time: Number((distance / input.maxDistance).toFixed(6)),
        x: Number((input.x + nx * distance).toFixed(6)),
        y: Number((input.y + ny * distance).toFixed(6)),
        normalX,
        normalY,
    };
}
export function raycast(input) {
    if (!Number.isFinite(input.maxDistance) || input.maxDistance < 0)
        throw new Error(`Invalid raycast maxDistance: ${input.maxDistance}`);
    const direction = normalize(input.dx, input.dy);
    const layers = input.includeLayers ? new Set(input.includeLayers) : null;
    return input.obstacles
        .filter((obstacle) => !layers || (obstacle.layer && layers.has(obstacle.layer)))
        .map((obstacle) => rayAabb(input, obstacle, direction.x, direction.y))
        .filter((hit) => hit !== null)
        .sort((a, b) => a.distance - b.distance || a.obstacle.id.localeCompare(b.obstacle.id))[0] ?? null;
}
export function hasLineOfSight(input) {
    return raycast(input) === null;
}
//# sourceMappingURL=raycast.js.map