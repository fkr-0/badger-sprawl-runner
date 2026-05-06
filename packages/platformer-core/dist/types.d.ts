export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface Transform extends Rect {
    dir: number;
}
export interface Velocity {
    vx: number;
    vy: number;
}
export interface MovementState {
    onGround: boolean;
    coyoteLeft: number;
    jumpBuffered: number;
}
export interface Collider extends Rect {
    layer: number;
}
export interface Health {
    hp: number;
    maxHp: number;
    greyHp: number;
    invuln: number;
}
export interface HitboxSet {
    hurt: Rect | null;
    attack: Rect | null;
    parry: Rect | null;
}
export interface ActorFlags {
    hasRailgun: boolean;
    hasRocket: boolean;
    hasKatana: boolean;
}
//# sourceMappingURL=types.d.ts.map