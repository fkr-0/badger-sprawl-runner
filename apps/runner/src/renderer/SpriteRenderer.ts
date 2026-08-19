/**
 * SpriteRenderer - loads sprite sheets and draws animated frames
 */

import {
	type LoadedSheet,
	type SpriteSheetLoadOptions,
	bindLoadedSpriteSheet,
	createSpriteManifestReloadPlan,
	loadSpriteSheet,
} from '@badger/sprite-contracts';
import {
	normalizeArcadeSpriteManifest,
	type ArcadeSpriteManifest as SpriteManifest,
} from '@arcade/runtime/sprites';
import { isRuntimeSpriteSheet } from './SpriteSheetLifecycle';

export interface SpriteSheetLoadFailure {
	sheetId: string;
	file: string;
	error: Error;
	attempts: number;
}

function normalizeRetries(value: number | undefined): number {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.floor(Number(value)));
}

function normalizeRetryDelay(value: number | undefined): number {
	if (!Number.isFinite(value)) return 120;
	return Math.max(0, Math.floor(Number(value)));
}

function asError(reason: unknown): Error {
	return reason instanceof Error ? reason : new Error(String(reason));
}

function defaultShouldRetry(context: SpriteSheetRetryContext): boolean {
	return (
		context.error.name !== 'AbortError' && context.error.name !== 'SpriteSheetDimensionLoadError'
	);
}

function waitForRetry(delayMs: number, signal: AbortSignal): Promise<void> {
	if (delayMs <= 0) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			signal.removeEventListener('abort', onAbort);
			resolve();
		}, delayMs);
		const onAbort = () => {
			clearTimeout(timeout);
			signal.removeEventListener('abort', onAbort);
			const error = new Error('Sprite sheet retry aborted.');
			error.name = 'AbortError';
			reject(error);
		};
		if (signal.aborted) onAbort();
		else signal.addEventListener('abort', onAbort, { once: true });
	});
}

interface SheetLoadAttemptResult {
	loaded: LoadedSheet;
	attempts: number;
}

interface SheetLoadAttemptFailure {
	error: Error;
	attempts: number;
}

export type SpriteManifestLoadProgressPhase =
	| 'manifest-ready'
	| 'sheet-reused'
	| 'sheet-start'
	| 'sheet-retry'
	| 'sheet-success'
	| 'sheet-failure'
	| 'complete';

export interface SpriteManifestLoadProgress {
	generation: number;
	manifestUrl: string;
	phase: SpriteManifestLoadProgressPhase;
	completedSheets: number;
	totalSheets: number;
	sheetId?: string;
	file?: string;
	attempt?: number;
	maxAttempts?: number;
	error?: Error;
}

export interface SpriteSheetRetryContext {
	sheetId: string;
	file: string;
	attempt: number;
	maxAttempts: number;
	error: Error;
}

export interface SpriteManifestLoadReport {
	generation: number;
	manifestUrl: string;
	requestedSheetIds: readonly string[];
	loadedSheetIds: readonly string[];
	decodedSheetIds: readonly string[];
	reloadSheetIds: readonly string[];
	reusedSheetIds: readonly string[];
	addedSheetIds: readonly string[];
	removedSheetIds: readonly string[];
	changedSheetIds: readonly string[];
	unchangedSheetIds: readonly string[];
	forcedReloadSheetIds: readonly string[];
	skippedSheetIds: readonly string[];
	failures: readonly SpriteSheetLoadFailure[];
	allowPartial: boolean;
	reuseUnchanged: boolean;
	maxConcurrent: number;
	maxRetries: number;
	totalAttempts: number;
	stale: boolean;
	committed: boolean;
}

export interface SpriteManifestLoadOptions {
	allowPartial?: boolean;
	reuseUnchanged?: boolean;
	forceReloadSheetIds?: readonly string[];
	maxConcurrent?: number;
	maxRetries?: number;
	retryDelayMs?: number;
	shouldRetry?(context: SpriteSheetRetryContext): boolean;
	onProgress?(progress: SpriteManifestLoadProgress): void;
}

export interface SpriteRendererDependencies {
	fetchManifest?(manifestUrl: string): Promise<unknown>;
	loadSheet?(
		sheet: SpriteManifest['sheets'][number],
		ctx: CanvasRenderingContext2D,
		options?: SpriteSheetLoadOptions
	): Promise<LoadedSheet>;
}

export class SpriteManifestLoadError extends Error {
	constructor(public readonly report: SpriteManifestLoadReport) {
		super(
			`Failed to load ${report.failures.length} sprite sheet(s): ${report.failures
				.map((failure) => failure.sheetId)
				.join(', ')}`
		);
		this.name = 'SpriteManifestLoadError';
	}
}

async function fetchManifestJson(manifestUrl: string): Promise<unknown> {
	const response = await fetch(manifestUrl);
	if (!response.ok) {
		throw new Error(
			`Failed to load sprite manifest: ${manifestUrl} (${response.status} ${response.statusText})`
		);
	}
	return response.json();
}

function normalizeConcurrency(value: number | undefined): number {
	if (!Number.isFinite(value)) return 8;
	return Math.max(1, Math.floor(Number(value)));
}

type SettledSheetLoad = PromiseSettledResult<{
	sheet: SpriteManifest['sheets'][number];
	loaded: LoadedSheet;
	attempts: number;
}>;

async function loadSheetsWithConcurrency(
	sheets: readonly SpriteManifest['sheets'][number][],
	maxConcurrent: number,
	load: (sheet: SpriteManifest['sheets'][number]) => Promise<SheetLoadAttemptResult>,
	onSettled: (
		sheet: SpriteManifest['sheets'][number],
		result: PromiseSettledResult<SheetLoadAttemptResult>
	) => void
): Promise<readonly SettledSheetLoad[]> {
	const results: SettledSheetLoad[] = new Array(sheets.length);
	let nextIndex = 0;
	const worker = async () => {
		while (true) {
			const index = nextIndex;
			nextIndex += 1;
			const sheet = sheets[index];
			if (!sheet) return;
			try {
				const value = await load(sheet);
				results[index] = {
					status: 'fulfilled',
					value: { sheet, loaded: value.loaded, attempts: value.attempts },
				};
				onSettled(sheet, { status: 'fulfilled', value });
			} catch (reason) {
				results[index] = { status: 'rejected', reason };
				onSettled(sheet, { status: 'rejected', reason });
			}
		}
	};
	const workerCount = Math.min(maxConcurrent, sheets.length);
	await Promise.all(Array.from({ length: workerCount }, () => worker()));
	return results;
}

interface FallbackEntity {
	x: number;
	y: number;
	w: number;
	h: number;
	dir: number;
	onGround: boolean;
	scaleX?: number;
	scaleY?: number;
}

export class SpriteRenderer {
	private sheets = new Map<string, LoadedSheet>();
	private manifest: SpriteManifest | null = null;
	private loadGeneration = 0;
	private lastLoadReport: SpriteManifestLoadReport | null = null;
	private readonly fetchManifest: (manifestUrl: string) => Promise<unknown>;
	private readonly loadSheet: (
		sheet: SpriteManifest['sheets'][number],
		ctx: CanvasRenderingContext2D,
		options?: SpriteSheetLoadOptions
	) => Promise<LoadedSheet>;
	private activeLoadController: AbortController | null = null;

	constructor(
		private ctx: CanvasRenderingContext2D,
		dependencies: SpriteRendererDependencies = {}
	) {
		this.fetchManifest = dependencies.fetchManifest ?? fetchManifestJson;
		this.loadSheet = dependencies.loadSheet ?? loadSpriteSheet;
	}

	async loadManifest(
		manifestUrl: string,
		options: SpriteManifestLoadOptions = {}
	): Promise<SpriteManifestLoadReport> {
		this.activeLoadController?.abort();
		const controller = new AbortController();
		this.activeLoadController = controller;
		const generation = ++this.loadGeneration;
		const allowPartial = options.allowPartial ?? false;
		const reuseUnchanged = options.reuseUnchanged ?? true;
		const maxConcurrent = normalizeConcurrency(options.maxConcurrent);
		const maxRetries = normalizeRetries(options.maxRetries);
		const retryDelayMs = normalizeRetryDelay(options.retryDelayMs);
		const maxAttempts = maxRetries + 1;
		const shouldRetry = options.shouldRetry ?? defaultShouldRetry;
		let completedSheets = 0;
		const emitProgress = (
			phase: SpriteManifestLoadProgressPhase,
			details: Partial<SpriteManifestLoadProgress> = {}
		) => {
			const progress = Object.freeze({
				generation,
				manifestUrl,
				phase,
				completedSheets,
				totalSheets: details.totalSheets ?? 0,
				...details,
			});
			try {
				options.onProgress?.(progress);
			} catch {
				// Progress observers are diagnostic and must not corrupt loading.
			}
		};
		let manifest: SpriteManifest;
		try {
			manifest = normalizeArcadeSpriteManifest(await this.fetchManifest(manifestUrl));
		} catch (error) {
			if (this.activeLoadController === controller) this.activeLoadController = null;
			throw error;
		}
		const runtimeSheets = manifest.sheets.filter(isRuntimeSpriteSheet);
		const previousRuntimeSheets = this.manifest?.sheets.filter(isRuntimeSpriteSheet) ?? [];
		const reloadPlan = createSpriteManifestReloadPlan(
			this.manifest ? { version: this.manifest.version, sheets: previousRuntimeSheets } : null,
			{ version: manifest.version, sheets: runtimeSheets },
			{
				availableSheetIds: this.sheets.keys(),
				forceReloadSheetIds: options.forceReloadSheetIds,
				reuseUnchanged,
			}
		);
		const reusableIds = new Set(reloadPlan.reusableSheetIds);
		const reusedSheets = new Map<string, LoadedSheet>();
		const sheetsToLoad: SpriteManifest['sheets'][number][] = [];
		for (const sheet of runtimeSheets) {
			if (!reusableIds.has(sheet.id)) {
				sheetsToLoad.push(sheet);
				continue;
			}
			const current = this.sheets.get(sheet.id);
			if (!current) {
				sheetsToLoad.push(sheet);
				continue;
			}
			reusedSheets.set(sheet.id, bindLoadedSpriteSheet(sheet, current.image));
		}
		const skippedSheetIds = manifest.sheets
			.filter((sheet) => !isRuntimeSpriteSheet(sheet))
			.map((sheet) => sheet.id);
		emitProgress('manifest-ready', { totalSheets: runtimeSheets.length });
		for (const sheet of runtimeSheets) {
			if (!reusedSheets.has(sheet.id)) continue;
			completedSheets += 1;
			emitProgress('sheet-reused', {
				totalSheets: runtimeSheets.length,
				sheetId: sheet.id,
				file: sheet.file,
			});
		}
		const loadWithRetry = async (
			sheet: SpriteManifest['sheets'][number]
		): Promise<SheetLoadAttemptResult> => {
			let attempt = 0;
			while (attempt < maxAttempts) {
				attempt += 1;
				emitProgress('sheet-start', {
					totalSheets: runtimeSheets.length,
					sheetId: sheet.id,
					file: sheet.file,
					attempt,
					maxAttempts,
				});
				try {
					return {
						loaded: await this.loadSheet(sheet, this.ctx, { signal: controller.signal }),
						attempts: attempt,
					};
				} catch (reason) {
					const error = asError(reason);
					const context = { sheetId: sheet.id, file: sheet.file, attempt, maxAttempts, error };
					if (attempt >= maxAttempts || !shouldRetry(context)) {
						throw { error, attempts: attempt } satisfies SheetLoadAttemptFailure;
					}
					emitProgress('sheet-retry', {
						totalSheets: runtimeSheets.length,
						sheetId: sheet.id,
						file: sheet.file,
						attempt,
						maxAttempts,
						error,
					});
					try {
						await waitForRetry(retryDelayMs, controller.signal);
					} catch (reason) {
						throw { error: asError(reason), attempts: attempt } satisfies SheetLoadAttemptFailure;
					}
				}
			}
			throw {
				error: new Error(`Unable to load ${sheet.id}.`),
				attempts: maxAttempts,
			} satisfies SheetLoadAttemptFailure;
		};
		const settled = await loadSheetsWithConcurrency(
			sheetsToLoad,
			maxConcurrent,
			loadWithRetry,
			(sheet, result) => {
				completedSheets += 1;
				if (result.status === 'fulfilled') {
					emitProgress('sheet-success', {
						totalSheets: runtimeSheets.length,
						sheetId: sheet.id,
						file: sheet.file,
						attempt: result.value.attempts,
						maxAttempts,
					});
				} else {
					const failure = result.reason as SheetLoadAttemptFailure;
					emitProgress('sheet-failure', {
						totalSheets: runtimeSheets.length,
						sheetId: sheet.id,
						file: sheet.file,
						attempt: failure.attempts,
						maxAttempts,
						error: failure.error,
					});
				}
			}
		);
		const decodedSheets = new Map<string, LoadedSheet>();
		const failures: SpriteSheetLoadFailure[] = [];

		for (const [index, result] of settled.entries()) {
			const sheet = sheetsToLoad[index];
			if (!sheet) continue;
			if (result.status === 'fulfilled') {
				decodedSheets.set(sheet.id, result.value.loaded);
			} else {
				const failure = result.reason as SheetLoadAttemptFailure;
				failures.push({
					sheetId: sheet.id,
					file: sheet.file,
					error: failure.error,
					attempts: failure.attempts,
				});
			}
		}
		const loadedSheets = new Map<string, LoadedSheet>();
		for (const sheet of runtimeSheets) {
			const loaded = reusedSheets.get(sheet.id) ?? decodedSheets.get(sheet.id);
			if (loaded) loadedSheets.set(sheet.id, loaded);
		}

		const stale = generation !== this.loadGeneration;
		if (this.activeLoadController === controller) this.activeLoadController = null;
		const committed = !stale && (failures.length === 0 || allowPartial);
		const report: SpriteManifestLoadReport = Object.freeze({
			generation,
			manifestUrl,
			requestedSheetIds: Object.freeze(runtimeSheets.map((sheet) => sheet.id)),
			loadedSheetIds: Object.freeze([...loadedSheets.keys()]),
			decodedSheetIds: Object.freeze([...decodedSheets.keys()]),
			reloadSheetIds: reloadPlan.reloadSheetIds,
			reusedSheetIds: Object.freeze([...reusedSheets.keys()]),
			addedSheetIds: reloadPlan.diff.addedSheetIds,
			removedSheetIds: reloadPlan.diff.removedSheetIds,
			changedSheetIds: reloadPlan.diff.changedSheetIds,
			unchangedSheetIds: reloadPlan.diff.unchangedSheetIds,
			forcedReloadSheetIds: reloadPlan.forcedReloadSheetIds,
			skippedSheetIds: Object.freeze(skippedSheetIds),
			failures: Object.freeze(failures.map((failure) => Object.freeze(failure))),
			allowPartial,
			reuseUnchanged,
			maxConcurrent,
			maxRetries,
			totalAttempts: settled.reduce((total, result) => {
				if (result.status === 'fulfilled') return total + result.value.attempts;
				return total + ((result.reason as SheetLoadAttemptFailure).attempts ?? 0);
			}, 0),
			stale,
			committed,
		});

		if (committed) {
			this.manifest = manifest;
			this.sheets = loadedSheets;
			this.lastLoadReport = report;
		}
		emitProgress('complete', { totalSheets: runtimeSheets.length });
		if (!stale && failures.length > 0 && !allowPartial) {
			this.lastLoadReport = report;
			throw new SpriteManifestLoadError(report);
		}
		return report;
	}

	cancelPendingLoads(): void {
		this.activeLoadController?.abort();
		this.activeLoadController = null;
		this.loadGeneration += 1;
	}

	clear(): void {
		this.cancelPendingLoads();
		this.sheets.clear();
		this.manifest = null;
		this.lastLoadReport = null;
	}

	getManifest(): SpriteManifest | null {
		return this.manifest;
	}

	getLastLoadReport(): SpriteManifestLoadReport | null {
		return this.lastLoadReport;
	}

	getLoadedSheetIds(): readonly string[] {
		return Object.freeze([...this.sheets.keys()]);
	}

	drawFrame(
		sheetId: string,
		animName: string,
		frameIndex: number,
		x: number,
		y: number,
		flipX = false,
		scaleX = 1,
		scaleY = 1
	): void {
		this.drawFrameTo(this.ctx, sheetId, animName, frameIndex, x, y, flipX, scaleX, scaleY);
	}

	drawFrameTo(
		ctx: CanvasRenderingContext2D,
		sheetId: string,
		animName: string,
		frameIndex: number,
		x: number,
		y: number,
		flipX = false,
		scaleX = 1,
		scaleY = 1
	): void {
		const sheet = this.sheets.get(sheetId);
		if (!sheet) return;

		// Apply squash/stretch around the frame's feet rather than a hard-coded
		// point. This keeps 32px icons, 48px actors and 96px bosses aligned.
		const [frameWidth, frameHeight] = sheet.sheet.frameSize;
		const originalTransform = ctx.getTransform();
		ctx.translate(x + frameWidth / 2, y + frameHeight);
		ctx.scale(scaleX, scaleY);
		ctx.translate(-(x + frameWidth / 2), -(y + frameHeight));

		sheet.drawFrame(ctx, animName, frameIndex, x, y, flipX);

		ctx.setTransform(originalTransform);
	}

	drawEntity(
		sheetId: string,
		animState: { currentAnim: string; frame: number },
		x: number,
		y: number,
		flipX = false,
		scaleX = 1,
		scaleY = 1
	): void {
		this.drawFrame(sheetId, animState.currentAnim, animState.frame, x, y, flipX, scaleX, scaleY);
	}

	hasSheet(sheetId: string): boolean {
		return this.sheets.has(sheetId);
	}

	getSheet(sheetId: string): LoadedSheet | undefined {
		return this.sheets.get(sheetId);
	}

	getContext(): CanvasRenderingContext2D {
		return this.ctx;
	}

	getFallbackDraw(): (
		ctx: CanvasRenderingContext2D,
		entity: FallbackEntity,
		x: number,
		y: number
	) => void {
		return (ctx, entity, x, y) => {
			const scaleX = entity.scaleX ?? 1;
			const scaleY = entity.scaleY ?? 1;

			ctx.save();

			// Apply squash and stretch from center
			const centerX = x + entity.w / 2;
			const centerY = y + entity.h / 2;
			ctx.translate(centerX, centerY);
			if (entity.dir < 0) ctx.scale(-1, 1);
			ctx.scale(scaleX, scaleY);
			ctx.translate(-centerX, -centerY);

			// Body
			ctx.fillStyle = '#272b32';
			ctx.fillRect(x, y, entity.w, entity.h);

			// Stripe
			ctx.fillStyle = '#f0f0e8';
			ctx.fillRect(x + 4, y + 8, 26, 10);

			// Eyes
			ctx.fillStyle = '#111';
			ctx.fillRect(x + 19, y + 10, 5, 5);

			// Legs with animation
			const runCycle = Math.sin(Date.now() / 60) * 4;
			ctx.fillStyle = '#364457';
			ctx.fillRect(x + 1, y + 32 + (entity.onGround ? runCycle : 0), 13, 16);
			ctx.fillRect(x + 20, y + 32 + (entity.onGround ? -runCycle : 0), 13, 16);

			ctx.restore();
		};
	}
}
