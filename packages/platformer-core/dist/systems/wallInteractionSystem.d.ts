import type { Rect } from '../types';
export interface WallProbeBody extends Rect {
    id: string;
    vx: number;
    vy: number;
    dir: number;
    onGround: boolean;
}
export interface WallInteractionParams {
    probeDistance: number;
    wallSlideMaxSpeed: number;
    wallJumpVelocityX: number;
    wallJumpVelocityY: number;
}
export interface WallContact {
    wallId: string;
    side: 'left' | 'right';
}
export interface WallInteractionResult<T extends WallProbeBody> {
    body: T;
    contact: WallContact | null;
    wallSliding: boolean;
    wallJumped: boolean;
}
export declare function detectWallContact(body: WallProbeBody, walls: ReadonlyArray<Rect & {
    id: string;
}>, probeDistance: number): WallContact | null;
export declare function applyWallInteraction<T extends WallProbeBody>(body: T, walls: ReadonlyArray<Rect & {
    id: string;
}>, params: WallInteractionParams, input?: {
    jumpPressed?: boolean;
}): WallInteractionResult<T>;
//# sourceMappingURL=wallInteractionSystem.d.ts.map