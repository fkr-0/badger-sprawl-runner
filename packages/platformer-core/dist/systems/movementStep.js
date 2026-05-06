export function movementStep(input) {
    let { vx, vy, x, y, onGround, axisInput, isFastFalling, params, dt } = input;
    // Horizontal acceleration
    const accel = onGround ? params.runAccelGround : params.runAccelAir;
    vx += axisInput * accel * dt;
    // Friction on ground
    if (axisInput === 0 && onGround) {
        const friction = Math.sign(vx) * params.friction * dt;
        vx = Math.abs(friction) > Math.abs(vx) ? 0 : vx - friction;
    }
    // Clamp speed
    vx = Math.max(-params.maxRunSpeed, Math.min(params.maxRunSpeed, vx));
    // Fast fall multiplier
    if (isFastFalling && vy > 0) {
        vy += params.gravity * (params.fastFallMultiplier - 1) * dt;
    }
    // Apply velocity
    x += vx * dt;
    y += vy * dt;
    return { vx, vy, x, y };
}
//# sourceMappingURL=movementStep.js.map