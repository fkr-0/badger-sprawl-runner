export interface PlatformStepInput {
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    prevVy: number;
    dt: number;
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
/** Resolve one-way platform landing through the shared arcade collision primitive. */
export declare function platformStep(input: PlatformStepInput): PlatformStepOutput;
//# sourceMappingURL=platformStep.d.ts.map