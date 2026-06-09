import type { Rect } from '../types';
import type { SweptObstacle } from './sweptAabb';
export type LedgeCorrectionResultKind = 'unchanged' | 'corrected' | 'blocked';
export type LedgeCorrectionEventKind = 'horizontal-corner' | 'vertical-head-bump' | 'vertical-corner';
export interface LedgeCorrectionVelocity {
    vx: number;
    vy: number;
}
export interface LedgeCorrectionEvent {
    kind: LedgeCorrectionEventKind;
    obstacleId: string;
    dx: number;
    dy: number;
}
export interface LedgeCorrectionInput {
    body: Rect;
    intendedVelocity: LedgeCorrectionVelocity;
    obstacles: ReadonlyArray<SweptObstacle>;
    maxCorrectionPixels: number;
    epsilon?: number;
}
export interface LedgeCorrectionOutput {
    result: LedgeCorrectionResultKind;
    x: number;
    y: number;
    event: LedgeCorrectionEvent | null;
    blockedBy?: string;
}
export declare function resolveLedgeCorrection(input: LedgeCorrectionInput): LedgeCorrectionOutput;
//# sourceMappingURL=ledgeCorrectionSystem.d.ts.map