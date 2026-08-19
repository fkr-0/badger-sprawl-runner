import {
	normalizeArcadeSpriteManifest,
	resolveArcadeSpriteFrame,
} from '@arcade/runtime/sprites';
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

export type SpriteAtlasDimensionResolver = (
	sheet: SpriteSheet
) => SpriteAtlasDimensions | null | undefined;

export interface SpriteManifestDimensionAudit {
	ok: boolean;
	manifest: SpriteManifest | null;
	sheets: readonly SpriteSheetDimensionAudit[];
	diagnostics: readonly SpriteAtlasDiagnostic[];
}

function normalizeSheet(sheet: SpriteSheet): SpriteSheet {
	return normalizeArcadeSpriteManifest({ version: '1.0.0', sheets: [sheet] })
		.sheets[0] as SpriteSheet;
}

function animationColumnCount(sheet: SpriteSheet, animationName: string): number {
	const animation = sheet.animations[animationName];
	if (!animation) return 0;
	let highestFrame = animation.frames - 1;
	for (const frame of animation.order ?? []) highestFrame = Math.max(highestFrame, frame);
	return highestFrame + 1;
}

/**
 * Resolve the exact pixel geometry required by a valid sprite sheet contract.
 * Explicit grids use their declared capacity. Legacy row-per-animation sheets
 * use one animation per row and the widest animation defines atlas width.
 */
export function deriveSpriteAtlasLayout(input: SpriteSheet): SpriteAtlasLayout {
	const sheet = normalizeSheet(input);
	const [frameWidth, frameHeight] = sheet.frameSize;
	const animationEntries = Object.entries(sheet.animations);
	const mode: SpriteAtlasLayoutMode = sheet.grid ? 'explicit-grid' : 'animation-rows';
	const columns = sheet.grid
		? sheet.grid.columns
		: Math.max(...animationEntries.map(([name]) => animationColumnCount(sheet, name)));
	const rows = sheet.grid?.rows ?? animationEntries.length;
	const animations = animationEntries.map(([name, animation], row) =>
		Object.freeze({
			name,
			row: sheet.grid ? null : row,
			frames: animation.frames,
			columnsUsed: animationColumnCount(sheet, name),
		})
	);

	return Object.freeze({
		sheetId: sheet.id,
		mode,
		frameWidth,
		frameHeight,
		columns,
		rows,
		frameCapacity: columns * rows,
		expectedWidth: columns * frameWidth,
		expectedHeight: rows * frameHeight,
		animations: Object.freeze(animations),
	});
}

/** Build a renderer-neutral, cell-deduplicated atlas assembly plan. */
export function createSpriteAtlasAssemblyPlan(input: SpriteSheet): SpriteAtlasAssemblyPlan {
	const sheet = normalizeSheet(input);
	const layout = deriveSpriteAtlasLayout(sheet);
	const cells = new Map<
		number,
		Omit<SpriteAtlasCellPlan, 'references'> & { references: SpriteAtlasFrameReference[] }
	>();

	for (const [animationName, animation] of Object.entries(sheet.animations)) {
		for (let localFrame = 0; localFrame < animation.frames; localFrame += 1) {
			const address = resolveArcadeSpriteFrame(sheet, animationName, localFrame);
			if (!address) throw new Error(`Unable to resolve ${sheet.id}:${animationName}:${localFrame}`);
			const column = address.sourceX / layout.frameWidth;
			const row = address.sourceY / layout.frameHeight;
			const index = row * layout.columns + column;
			const existing = cells.get(index) ?? {
				index,
				column,
				row,
				x: address.sourceX,
				y: address.sourceY,
				width: layout.frameWidth,
				height: layout.frameHeight,
				references: [],
			};
			existing.references.push(
				Object.freeze({ animationName, localFrame, absoluteFrame: address.absoluteFrame })
			);
			cells.set(index, existing);
		}
	}

	const orderedCells = [...cells.values()]
		.sort((left, right) => left.index - right.index)
		.map((cell) => Object.freeze({ ...cell, references: Object.freeze(cell.references) }));

	return Object.freeze({
		sheetId: sheet.id,
		file: sheet.file,
		layout,
		usedCellCount: orderedCells.length,
		unusedCellCount: Math.max(0, layout.frameCapacity - orderedCells.length),
		cells: Object.freeze(orderedCells),
	});
}

function dimensionDiagnostic(
	sheet: SpriteSheet,
	severity: SpriteAtlasDiagnosticSeverity,
	code: string,
	message: string,
	axis?: 'width' | 'height',
	expected?: number,
	actual?: number
): SpriteAtlasDiagnostic {
	return Object.freeze({
		severity,
		code,
		message,
		sheetId: sheet.id,
		file: sheet.file,
		...(axis ? { axis } : {}),
		...(expected === undefined ? {} : { expected }),
		...(actual === undefined ? {} : { actual }),
	});
}

/** Compare an image's pixel dimensions with the geometry implied by its sheet. */
export function auditSpriteAtlasDimensions(
	input: SpriteSheet,
	actual: SpriteAtlasDimensions,
	options: SpriteAtlasDimensionAuditOptions = {}
): SpriteSheetDimensionAudit {
	const sheet = normalizeSheet(input);
	const layout = deriveSpriteAtlasLayout(sheet);
	const requireExact = options.requireExact ?? true;
	const diagnostics: SpriteAtlasDiagnostic[] = [];
	const widthValid = Number.isInteger(actual.width) && actual.width > 0;
	const heightValid = Number.isInteger(actual.height) && actual.height > 0;

	if (!widthValid) {
		diagnostics.push(
			dimensionDiagnostic(
				sheet,
				'error',
				'invalid-width',
				'Atlas width must be a positive integer.',
				'width',
				layout.expectedWidth,
				actual.width
			)
		);
	}
	if (!heightValid) {
		diagnostics.push(
			dimensionDiagnostic(
				sheet,
				'error',
				'invalid-height',
				'Atlas height must be a positive integer.',
				'height',
				layout.expectedHeight,
				actual.height
			)
		);
	}

	if (widthValid && actual.width % layout.frameWidth !== 0) {
		diagnostics.push(
			dimensionDiagnostic(
				sheet,
				'error',
				'width-not-frame-aligned',
				`Atlas width ${actual.width} is not divisible by frame width ${layout.frameWidth}.`,
				'width',
				layout.expectedWidth,
				actual.width
			)
		);
	}
	if (heightValid && actual.height % layout.frameHeight !== 0) {
		diagnostics.push(
			dimensionDiagnostic(
				sheet,
				'error',
				'height-not-frame-aligned',
				`Atlas height ${actual.height} is not divisible by frame height ${layout.frameHeight}.`,
				'height',
				layout.expectedHeight,
				actual.height
			)
		);
	}

	for (const axis of ['width', 'height'] as const) {
		if ((axis === 'width' && !widthValid) || (axis === 'height' && !heightValid)) continue;
		const expected = axis === 'width' ? layout.expectedWidth : layout.expectedHeight;
		const value = actual[axis];
		if (value === expected) continue;
		const smaller = value < expected;
		const severity: SpriteAtlasDiagnosticSeverity = smaller || requireExact ? 'error' : 'warning';
		diagnostics.push(
			dimensionDiagnostic(
				sheet,
				severity,
				`${axis}-${smaller ? 'too-small' : 'has-extra-space'}`,
				`${axis[0]?.toUpperCase()}${axis.slice(1)} is ${value}px; contract expects ${expected}px.`,
				axis,
				expected,
				value
			)
		);
	}

	return Object.freeze({
		ok: !diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
		sheet,
		layout,
		actual: Object.freeze({ width: actual.width, height: actual.height }),
		actualColumns:
			widthValid && actual.width % layout.frameWidth === 0
				? actual.width / layout.frameWidth
				: null,
		actualRows:
			heightValid && actual.height % layout.frameHeight === 0
				? actual.height / layout.frameHeight
				: null,
		diagnostics: Object.freeze(diagnostics),
	});
}

/** Audit every manifest sheet without coupling the shared contract to a filesystem or browser loader. */
export function auditSpriteManifestDimensions(
	manifestSource: unknown,
	resolveDimensions: SpriteAtlasDimensionResolver,
	options: SpriteAtlasDimensionAuditOptions = {}
): SpriteManifestDimensionAudit {
	let manifest: SpriteManifest;
	try {
		manifest = normalizeArcadeSpriteManifest(manifestSource) as SpriteManifest;
	} catch (error) {
		return Object.freeze({
			ok: false,
			manifest: null,
			sheets: Object.freeze([]),
			diagnostics: Object.freeze([
				Object.freeze({
					severity: 'error' as const,
					code: 'invalid-manifest',
					message: error instanceof Error ? error.message : 'Invalid sprite manifest.',
					sheetId: '<manifest>',
					file: '<manifest>',
				}),
			]),
		});
	}

	const sheets: SpriteSheetDimensionAudit[] = [];
	const diagnostics: SpriteAtlasDiagnostic[] = [];
	for (const sheet of manifest.sheets) {
		const dimensions = resolveDimensions(sheet);
		if (!dimensions) {
			diagnostics.push(
				dimensionDiagnostic(
					sheet,
					'error',
					'asset-dimensions-missing',
					`No dimensions were provided for ${sheet.file}.`
				)
			);
			continue;
		}
		const audit = auditSpriteAtlasDimensions(sheet, dimensions, options);
		sheets.push(audit);
		diagnostics.push(...audit.diagnostics);
	}

	return Object.freeze({
		ok: !diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
		manifest,
		sheets: Object.freeze(sheets),
		diagnostics: Object.freeze(diagnostics),
	});
}
