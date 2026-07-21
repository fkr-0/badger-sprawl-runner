import type { SpriteManifest, SpriteSheet } from './types';
export type SpriteAtlasLayoutMode = 'explicit-grid' | 'animation-rows';
export type SpriteAtlasDiagnosticSeverity = 'error' | 'warning';
export interface SpriteAtlasDimensions {
    width: number;
    height: number;
}
export interface SpriteAtlasAnimationLayout {
    name: string;
    row: number | null;
    frames: number;
    columnsUsed: number;
}
export interface SpriteAtlasLayout {
    sheetId: string;
    mode: SpriteAtlasLayoutMode;
    frameWidth: number;
    frameHeight: number;
    columns: number;
    rows: number;
    frameCapacity: number;
    expectedWidth: number;
    expectedHeight: number;
    animations: readonly SpriteAtlasAnimationLayout[];
}
export interface SpriteAtlasFrameReference {
    animationName: string;
    localFrame: number;
    absoluteFrame: number;
}
export interface SpriteAtlasCellPlan {
    index: number;
    column: number;
    row: number;
    x: number;
    y: number;
    width: number;
    height: number;
    references: readonly SpriteAtlasFrameReference[];
}
export interface SpriteAtlasAssemblyPlan {
    sheetId: string;
    file: string;
    layout: SpriteAtlasLayout;
    usedCellCount: number;
    unusedCellCount: number;
    cells: readonly SpriteAtlasCellPlan[];
}
export interface SpriteAtlasDiagnostic {
    severity: SpriteAtlasDiagnosticSeverity;
    code: string;
    message: string;
    sheetId: string;
    file: string;
    axis?: 'width' | 'height';
    expected?: number;
    actual?: number;
}
export interface SpriteAtlasDimensionAuditOptions {
    requireExact?: boolean;
}
export interface SpriteSheetDimensionAudit {
    ok: boolean;
    sheet: SpriteSheet;
    layout: SpriteAtlasLayout;
    actual: SpriteAtlasDimensions;
    actualColumns: number | null;
    actualRows: number | null;
    diagnostics: readonly SpriteAtlasDiagnostic[];
}
export type SpriteAtlasDimensionResolver = (sheet: SpriteSheet) => SpriteAtlasDimensions | null | undefined;
export interface SpriteManifestDimensionAudit {
    ok: boolean;
    manifest: SpriteManifest | null;
    sheets: readonly SpriteSheetDimensionAudit[];
    diagnostics: readonly SpriteAtlasDiagnostic[];
}
/**
 * Resolve the exact pixel geometry required by a valid sprite sheet contract.
 * Explicit grids use their declared capacity. Legacy row-per-animation sheets
 * use one animation per row and the widest animation defines atlas width.
 */
export declare function deriveSpriteAtlasLayout(input: SpriteSheet): SpriteAtlasLayout;
/** Build a renderer-neutral, cell-deduplicated atlas assembly plan. */
export declare function createSpriteAtlasAssemblyPlan(input: SpriteSheet): SpriteAtlasAssemblyPlan;
/** Compare an image's pixel dimensions with the geometry implied by its sheet. */
export declare function auditSpriteAtlasDimensions(input: SpriteSheet, actual: SpriteAtlasDimensions, options?: SpriteAtlasDimensionAuditOptions): SpriteSheetDimensionAudit;
/** Audit every manifest sheet without coupling the shared contract to a filesystem or browser loader. */
export declare function auditSpriteManifestDimensions(manifestSource: unknown, resolveDimensions: SpriteAtlasDimensionResolver, options?: SpriteAtlasDimensionAuditOptions): SpriteManifestDimensionAudit;
//# sourceMappingURL=production.d.ts.map