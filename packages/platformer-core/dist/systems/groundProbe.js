import { raycast } from './raycast';
export function probeGround(input) {
    if (!Number.isFinite(input.probeDistance) || input.probeDistance < 0)
        throw new Error(`Invalid probe distance: ${input.probeDistance}`);
    const inset = input.probeInset ?? 2;
    const y = input.body.y + input.body.h;
    const probes = [
        { x: input.body.x + inset, y },
        { x: input.body.x + input.body.w / 2, y },
        { x: input.body.x + input.body.w - inset, y },
    ];
    const hits = probes
        .map((probe) => raycast({ x: probe.x, y: probe.y, dx: 0, dy: 1, maxDistance: input.probeDistance, obstacles: input.obstacles }))
        .filter((hit) => hit !== null)
        .sort((a, b) => a.distance - b.distance || a.obstacle.id.localeCompare(b.obstacle.id));
    const hit = hits[0];
    if (!hit)
        return { grounded: false, distance: input.probeDistance, normalX: 0, normalY: 0 };
    return { grounded: true, distance: hit.distance, normalX: hit.normalX, normalY: hit.normalY, obstacleId: hit.obstacle.id };
}
//# sourceMappingURL=groundProbe.js.map