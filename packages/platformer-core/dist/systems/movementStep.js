import { approach } from '@arcade/runtime/core';
import { clampNumber } from '@arcade/runtime/core';
export function movementStep(input) {
    let { vx, vy, x, y, onGround, axisInput, isFastFalling, params, dt } = input;
    // Horizontal acceleration
    const accel = onGround ? params.runAccelGround : params.runAccelAir;
    vx += axisInput * accel * dt;
    // Friction on ground
    if (axisInput === 0 && onGround) {
        vx = approach(vx, 0, params.friction * dt);
    }
    // Clamp speed
    vx = clampNumber(vx, -params.maxRunSpeed, params.maxRunSpeed);
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