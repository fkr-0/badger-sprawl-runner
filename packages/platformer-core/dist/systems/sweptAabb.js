import { aabb } from './aabb';
function sweptTime(body, obstacle, vx, vy, dt) {
    if (obstacle.oneWay && vy <= 0)
        return null;
    if (aabb(body, obstacle)) {
        return { obstacle, time: 0, normalX: 0, normalY: -1, remainingTime: dt };
    }
    const dxEntry = vx > 0 ? obstacle.x - (body.x + body.w) : obstacle.x + obstacle.w - body.x;
    const dxExit = vx > 0 ? obstacle.x + obstacle.w - body.x : obstacle.x - (body.x + body.w);
    const dyEntry = vy > 0 ? obstacle.y - (body.y + body.h) : obstacle.y + obstacle.h - body.y;
    const dyExit = vy > 0 ? obstacle.y + obstacle.h - body.y : obstacle.y - (body.y + body.h);
    const txEntry = vx === 0 ? Number.NEGATIVE_INFINITY : dxEntry / (vx * dt);
    const txExit = vx === 0 ? Number.POSITIVE_INFINITY : dxExit / (vx * dt);
    const tyEntry = vy === 0 ? Number.NEGATIVE_INFINITY : dyEntry / (vy * dt);
    const tyExit = vy === 0 ? Number.POSITIVE_INFINITY : dyExit / (vy * dt);
    const entryTime = Math.max(Math.min(txEntry, txExit), Math.min(tyEntry, tyExit));
    const exitTime = Math.min(Math.max(txEntry, txExit), Math.max(tyEntry, tyExit));
    if (entryTime > exitTime || entryTime < 0 || entryTime > 1)
        return null;
    if (obstacle.oneWay && body.y + body.h > obstacle.y + 0.001)
        return null;
    let normalX = 0;
    let normalY = 0;
    if (Math.min(txEntry, txExit) > Math.min(tyEntry, tyExit))
        normalX = vx > 0 ? -1 : 1;
    else
        normalY = vy > 0 ? -1 : 1;
    return { obstacle, time: entryTime, normalX, normalY, remainingTime: dt * (1 - entryTime) };
}
export function sweepAabb(input) {
    if (!Number.isFinite(input.dt) || input.dt < 0)
        throw new Error(`Invalid sweep dt: ${input.dt}`);
    const hits = input.obstacles
        .map((obstacle) => sweptTime(input.body, obstacle, input.vx, input.vy, input.dt))
        .filter((hit) => hit !== null)
        .sort((a, b) => a.time - b.time || a.obstacle.id.localeCompare(b.obstacle.id));
    const hit = hits[0] ?? null;
    if (!hit) {
        return {
            x: input.body.x + input.vx * input.dt,
            y: input.body.y + input.vy * input.dt,
            vx: input.vx,
            vy: input.vy,
            hit: null,
        };
    }
    const epsilon = 0.0001;
    const x = input.body.x + input.vx * input.dt * hit.time + hit.normalX * epsilon;
    const y = input.body.y + input.vy * input.dt * hit.time + hit.normalY * epsilon;
    return {
        x,
        y,
        vx: hit.normalX !== 0 ? 0 : input.vx,
        vy: hit.normalY !== 0 ? 0 : input.vy,
        hit,
    };
}
//# sourceMappingURL=sweptAabb.js.map