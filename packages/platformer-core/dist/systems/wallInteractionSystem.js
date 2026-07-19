import { aabb } from './aabb';
function probe(body, side, distance) {
    return {
        x: side === 'left' ? body.x - distance : body.x + body.w,
        y: body.y + 2,
        w: distance,
        h: Math.max(1, body.h - 4),
    };
}
export function detectWallContact(body, walls, probeDistance) {
    if (!Number.isFinite(probeDistance) || probeDistance <= 0)
        throw new Error(`Invalid wall probe distance: ${probeDistance}`);
    const candidates = [];
    for (const wall of [...walls].sort((a, b) => a.id.localeCompare(b.id))) {
        if (aabb(probe(body, 'left', probeDistance), wall))
            candidates.push({ wallId: wall.id, side: 'left' });
        if (aabb(probe(body, 'right', probeDistance), wall))
            candidates.push({ wallId: wall.id, side: 'right' });
    }
    return candidates.sort((a, b) => a.wallId.localeCompare(b.wallId) || a.side.localeCompare(b.side))[0] ?? null;
}
export function applyWallInteraction(body, walls, params, input = {}) {
    const contact = detectWallContact(body, walls, params.probeDistance);
    const next = { ...body };
    let wallSliding = false;
    let wallJumped = false;
    if (contact && !body.onGround && body.vy > 0) {
        wallSliding = true;
        next.vy = Math.min(body.vy, params.wallSlideMaxSpeed);
    }
    if (contact && !body.onGround && input.jumpPressed) {
        wallJumped = true;
        wallSliding = false;
        next.vx = contact.side === 'left' ? params.wallJumpVelocityX : -params.wallJumpVelocityX;
        next.vy = params.wallJumpVelocityY;
        next.dir = contact.side === 'left' ? 1 : -1;
    }
    return { body: next, contact, wallSliding, wallJumped };
}
//# sourceMappingURL=wallInteractionSystem.js.map