import type { Rect } from '../types';
export interface SurfaceMaterial {
    id: string;
    friction: number;
    traction: number;
    restitution: number;
    conveyorX?: number;
    conveyorY?: number;
    damagePerSecond?: number;
    tags?: string[];
}
export interface MaterialZone extends Rect {
    material: SurfaceMaterial;
    priority?: number;
}
export interface MaterialBody extends Rect {
    vx: number;
    vy: number;
    onGround: boolean;
}
export interface MaterialContact {
    material: SurfaceMaterial;
    zone: MaterialZone;
    overlapArea: number;
}
export interface MaterialStepResult<T extends MaterialBody> {
    body: T;
    contact: MaterialContact | null;
    damage: number;
}
export declare const DEFAULT_SURFACE_MATERIAL: SurfaceMaterial;
export declare function sampleMaterialContact(body: Rect, zones: ReadonlyArray<MaterialZone>): MaterialContact | null;
export declare function applySurfaceMaterial<T extends MaterialBody>(body: T, zones: ReadonlyArray<MaterialZone>, dt: number, fallback?: SurfaceMaterial): MaterialStepResult<T>;
export declare function materialHasTag(material: SurfaceMaterial, tag: string): boolean;
//# sourceMappingURL=materialPhysics.d.ts.map