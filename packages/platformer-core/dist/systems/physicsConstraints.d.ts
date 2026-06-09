export interface ConstraintBody {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass?: number;
}
export interface DistanceConstraint {
    id: string;
    a: string;
    b: string;
    restLength: number;
    stiffness: number;
    damping?: number;
}
export interface ConstraintStepResult<T extends ConstraintBody> {
    bodies: T[];
    corrections: Array<{
        constraintId: string;
        dx: number;
        dy: number;
    }>;
}
export declare function solveDistanceConstraints<T extends ConstraintBody>(bodies: readonly T[], constraints: readonly DistanceConstraint[], dt: number, iterations?: number): ConstraintStepResult<T>;
//# sourceMappingURL=physicsConstraints.d.ts.map