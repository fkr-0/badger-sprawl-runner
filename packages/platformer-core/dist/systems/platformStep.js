import { aabb } from './aabb';
/**
 * Pure function: resolve platform collision
 * Snap player to platform if landing, reset coyote time
 */
export function platformStep(input) {
    const { x, y, w, h, vx, vy, prevVy, platforms, coyoteTime } = input;
    const player = { x, y, w, h };
    let onGround = false;
    let coyoteLeft = 0;
    for (const p of platforms) {
        // Check if player overlaps and is falling onto platform
        // Use prevVy to approximate previous position: y - prevVy*dt
        const prevY = y - prevVy * 0.016;
        if (aabb(player, p) && vy >= 0 && prevY + h <= p.y + 6) {
            // Snap to platform
            const snappedY = p.y - h;
            onGround = true;
            coyoteLeft = coyoteTime;
            return { x, y: snappedY, onGround, coyoteLeft };
        }
    }
    return { x, y, onGround, coyoteLeft };
}
//# sourceMappingURL=platformStep.js.map