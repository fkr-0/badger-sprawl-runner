export interface PlatformStepInput {
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    prevVy: number;
    platforms: Array<{
        x: number;
        y: number;
        w: number;
        h: number;
    }>;
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
export declare function platformStep(input: PlatformStepInput): PlatformStepOutput;
//# sourceMappingURL=platformStep.d.ts.map