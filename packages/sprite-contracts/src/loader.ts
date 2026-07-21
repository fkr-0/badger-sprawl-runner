import {
	drawArcadeSpriteCanvasFrame,
	resolveArcadeSpriteFrame,
} from '../../../vendor/arcade-runtime.mjs';
import { type SpriteSheetDimensionAudit, auditSpriteAtlasDimensions } from './production';
import type { LoadedSheet, SpriteSheet } from './types';

export interface SpriteSheetLoadOptions {
	signal?: AbortSignal;
	validateDimensions?: boolean;
	imageFactory?: () => HTMLImageElement;
}

export class SpriteSheetDimensionLoadError extends Error {
	constructor(public readonly audit: SpriteSheetDimensionAudit) {
		super(
			`Sprite sheet dimensions do not match ${audit.sheet.id}: expected ` +
				`${audit.layout.expectedWidth}x${audit.layout.expectedHeight}, got ` +
				`${audit.actual.width}x${audit.actual.height}`
		);
		this.name = 'SpriteSheetDimensionLoadError';
	}
}

function createAbortError(sheet: SpriteSheet): Error {
	const message = `Sprite sheet load aborted: ${sheet.file}`;
	if (typeof DOMException !== 'undefined') return new DOMException(message, 'AbortError');
	const error = new Error(message);
	error.name = 'AbortError';
	return error;
}

function getOrderedFrame(sheet: SpriteSheet, animName: string, frameIndex: number): number | null {
	return resolveArcadeSpriteFrame(sheet, animName, frameIndex)?.absoluteFrame ?? null;
}

function getFrameSource(
	sheet: SpriteSheet,
	animName: string,
	frameIndex: number
): [number, number] | null {
	const frame = resolveArcadeSpriteFrame(sheet, animName, frameIndex);
	return frame ? [frame.sourceX, frame.sourceY] : null;
}

/** Bind an already-decoded image to a normalized sprite-sheet contract. */
export function bindLoadedSpriteSheet(sheet: SpriteSheet, image: HTMLImageElement): LoadedSheet {
	return Object.freeze({
		sheet,
		image,
		drawFrame(
			ctx: CanvasRenderingContext2D,
			animName: string,
			frameIndex: number,
			x: number,
			y: number,
			flipX = false
		) {
			const frame = resolveArcadeSpriteFrame(sheet, animName, frameIndex);
			if (!frame) return;
			drawArcadeSpriteCanvasFrame(ctx, image, frame, {
				x,
				y,
				placement: 'top-left',
				flipX,
				imageSmoothingEnabled: false,
			});
		},
	});
}

/**
 * Browser image loading remains consumer-owned for this migration step. Frame
 * addressing is delegated to @arcade/runtime so Canvas and future Pixi paths
 * consume the same sheet/grid/order contract.
 */
export function loadSpriteSheet(
	sheet: SpriteSheet,
	ctx: CanvasRenderingContext2D,
	options: SpriteSheetLoadOptions = {}
): Promise<LoadedSheet> {
	return new Promise((resolve, reject) => {
		const img = options.imageFactory?.() ?? new Image();
		const signal = options.signal;
		let settled = false;
		const cleanup = () => {
			img.onload = null;
			img.onerror = null;
			signal?.removeEventListener('abort', onAbort);
		};
		const fail = (error: Error) => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(error);
		};
		const onAbort = () => {
			fail(createAbortError(sheet));
			try {
				img.src = '';
			} catch {
				// Some test/browser image implementations reject empty sources.
			}
		};

		if (signal?.aborted) {
			fail(createAbortError(sheet));
			return;
		}
		signal?.addEventListener('abort', onAbort, { once: true });
		img.onload = () => {
			const width = img.naturalWidth || img.width;
			const height = img.naturalHeight || img.height;
			if (options.validateDimensions !== false) {
				const audit = auditSpriteAtlasDimensions(sheet, { width, height });
				if (!audit.ok) {
					fail(new SpriteSheetDimensionLoadError(audit));
					return;
				}
			}
			if (settled) return;
			settled = true;
			cleanup();
			resolve(bindLoadedSpriteSheet(sheet, img));
		};
		img.onerror = () => fail(new Error(`Failed to load sprite sheet: ${sheet.file}`));
		img.src = sheet.file;
	});
}

export const __spriteLoaderInternals = { getFrameSource, getOrderedFrame };
