import { aabb } from './aabb';

export interface PlatformStepInput {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  prevVy: number;
  platforms: Array<{ x: number; y: number; w: number; h: number }>;
  coyoteTime: number;
}

export interface PlatformStepOutput {
  x: number;
  y: number;
  onGround: boolean;
  coyoteLeft: number;
}

/**
 * Pure function: resolve platform collision
 * Snap player to platform if landing, reset coyote time
 */
export function platformStep(input: PlatformStepInput): PlatformStepOutput {
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
