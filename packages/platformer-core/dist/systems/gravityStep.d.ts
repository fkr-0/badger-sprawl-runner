import type { PhysicsParams } from '../PhysicsParams';
/** Pure gravity integration delegated to the shared arcade numeric core. */
export declare function gravityStep(vy: number, params: Pick<PhysicsParams, 'gravity' | 'maxFallSpeed'>, dt: number): number;
export declare const gravityStepModule: {
    gravityStep: typeof gravityStep;
};
//# sourceMappingURL=gravityStep.d.ts.map