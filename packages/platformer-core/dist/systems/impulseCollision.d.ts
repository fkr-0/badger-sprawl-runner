export interface ImpulseBody {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass?: number;
    invMass?: number;
    restitution?: number;
    friction?: number;
}
export interface CollisionContact {
    a: string;
    b: string;
    normalX: number;
    normalY: number;
    penetration?: number;
}
export interface ImpulseEvent {
    contactId: string;
    impulse: number;
    frictionImpulse: number;
    correctionX: number;
    correctionY: number;
}
export interface ImpulseResolution<T extends ImpulseBody> {
    bodies: T[];
    events: ImpulseEvent[];
}
export declare function resolveImpulseCollisions<T extends ImpulseBody>(bodies: readonly T[], contacts: readonly CollisionContact[]): ImpulseResolution<T>;
//# sourceMappingURL=impulseCollision.d.ts.map