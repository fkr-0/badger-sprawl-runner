import type { AnimationDef, SpriteManifest, SpriteManifestSource } from './types';

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
	return Number.isInteger(value) && Number(value) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
	return Number.isInteger(value) && Number(value) >= 0;
}

function validateBox(value: unknown): boolean {
	if (!isObject(value)) return false;
	return (
		typeof value.x === 'number' &&
		typeof value.y === 'number' &&
		typeof value.w === 'number' &&
		typeof value.h === 'number' &&
		value.w > 0 &&
		value.h > 0 &&
		(value.label === undefined || typeof value.label === 'string')
	);
}

function validateAnimationEvent(value: unknown, frameCount: number): boolean {
	if (!isObject(value)) return false;
	return (
		isNonNegativeInteger(value.frame) &&
		Number(value.frame) < frameCount &&
		typeof value.kind === 'string' &&
		(value.name === undefined || typeof value.name === 'string') &&
		(value.payload === undefined || isObject(value.payload))
	);
}

function validateAnimation(value: unknown, totalFrames: number): value is AnimationDef {
	if (!isObject(value)) return false;
	if (!isPositiveInteger(value.frames)) return false;
	if (!isPositiveInteger(value.fps)) return false;

	const frameCount = Number(value.frames);
	if (value.order !== undefined) {
		if (!Array.isArray(value.order) || value.order.length !== frameCount) return false;
		for (const frame of value.order) {
			if (!isNonNegativeInteger(frame) || Number(frame) >= totalFrames) return false;
		}
	}
	if (value.loop !== undefined && typeof value.loop !== 'boolean') return false;
	if (value.anchor !== undefined) {
		if (
			!Array.isArray(value.anchor) ||
			value.anchor.length !== 2 ||
			typeof value.anchor[0] !== 'number' ||
			typeof value.anchor[1] !== 'number'
		) {
			return false;
		}
	}
	for (const key of ['hitboxes', 'hurtboxes'] as const) {
		if (value[key] !== undefined) {
			if (!Array.isArray(value[key]) || !value[key].every(validateBox)) return false;
		}
	}
	if (value.events !== undefined) {
		if (
			!Array.isArray(value.events) ||
			!value.events.every((event) => validateAnimationEvent(event, frameCount))
		) {
			return false;
		}
	}
	if (value.tags !== undefined) {
		if (!Array.isArray(value.tags) || !value.tags.every((tag) => typeof tag === 'string')) return false;
	}

	return true;
}

function getSourceSheets(source: Record<string, unknown>): unknown {
	return source.sheets ?? source.spriteSheets;
}

export function normalizeSpriteManifest(manifest: unknown): SpriteManifest {
	if (!validateSpriteManifest(manifest)) {
		throw new Error('Invalid sprite manifest');
	}

	const source = manifest as SpriteManifestSource;
	return {
		version: String(source.version ?? source.schemaVersion ?? '1.0.0'),
		sheets: source.sheets ?? source.spriteSheets ?? [],
	};
}

/**
 * Validate sprite manifest structure.
 * Accepts both normalized { version, sheets } manifests and the project runtime
 * data shape { schemaVersion, spriteSheets } used by data/sprites.json.
 */
export function validateSpriteManifest(manifest: unknown): manifest is SpriteManifestSource {
	if (!isObject(manifest)) return false;
	const hasVersion = typeof manifest.version === 'string' || manifest.schemaVersion !== undefined;
	if (!hasVersion) return false;

	const sheets = getSourceSheets(manifest);
	if (!Array.isArray(sheets)) return false;

	const seenIds = new Set<string>();
	for (const sheet of sheets) {
		if (!isObject(sheet)) return false;
		if (typeof sheet.id !== 'string' || sheet.id.length === 0) return false;
		if (seenIds.has(sheet.id)) return false;
		seenIds.add(sheet.id);
		if (typeof sheet.file !== 'string' || sheet.file.length === 0) return false;
		if (!Array.isArray(sheet.frameSize) || sheet.frameSize.length !== 2) return false;
		if (!isPositiveInteger(sheet.frameSize[0]) || !isPositiveInteger(sheet.frameSize[1])) return false;

		let totalGridFrames: number | undefined;
		if (sheet.grid !== undefined) {
			if (!isObject(sheet.grid)) return false;
			if (!isPositiveInteger(sheet.grid.columns) || !isPositiveInteger(sheet.grid.rows)) return false;
			totalGridFrames = Number(sheet.grid.columns) * Number(sheet.grid.rows);
		}

		if (!isObject(sheet.animations)) return false;
		const animations = sheet.animations;
		if (Object.keys(animations).length === 0) return false;
		for (const anim of Object.values(animations)) {
			if (!isObject(anim)) return false;
			const animationFrameCount = isPositiveInteger(anim.frames) ? Number(anim.frames) : 0;
			const totalFrames = totalGridFrames ?? animationFrameCount;
			if (!validateAnimation(anim, totalFrames)) return false;
		}
	}

	return true;
}
