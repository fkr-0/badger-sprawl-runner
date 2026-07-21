import { describe, expect, it } from 'vitest';
import type { LoadedSheet, SpriteManifest, SpriteSheet } from '@badger/sprite-contracts';
import {
	SpriteManifestLoadError,
	SpriteRenderer,
	type SpriteManifestLoadProgress,
	type SpriteRendererDependencies,
} from './SpriteRenderer';

function manifest(...sheets: SpriteSheet[]): SpriteManifest {
	return { version: '1.0.0', sheets };
}

function sheet(id: string, source?: Record<string, unknown>): SpriteSheet {
	return {
		id,
		file: `assets/sprites/${id}.png`,
		frameSize: [16, 16],
		animations: { idle: { frames: 1, fps: 1 } },
		...(source ? { source } : {}),
	};
}

function loaded(spriteSheet: SpriteSheet): LoadedSheet {
	return {
		sheet: spriteSheet,
		image: {} as HTMLImageElement,
		drawFrame() {},
	};
}

function renderer(dependencies: SpriteRendererDependencies): SpriteRenderer {
	return new SpriteRenderer({} as CanvasRenderingContext2D, dependencies);
}

function deferred<T>(): {
	promise: Promise<T>;
	resolve(value: T): void;
	reject(error: unknown): void;
} {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

describe('SpriteRenderer manifest lifecycle', () => {
	it('commits successful sheets atomically and reports archival skips', async () => {
		const actor = sheet('actor');
		const archive = sheet('archive', { classification: 'archival' });
		const spriteRenderer = renderer({
			fetchManifest: async () => manifest(actor, archive),
			loadSheet: async (definition) => loaded(definition),
		});

		const report = await spriteRenderer.loadManifest('sprites.json');

		expect(report).toMatchObject({
			requestedSheetIds: ['actor'],
			loadedSheetIds: ['actor'],
			skippedSheetIds: ['archive'],
			failures: [],
			committed: true,
			stale: false,
		});
		expect(spriteRenderer.hasSheet('actor')).toBe(true);
		expect(spriteRenderer.hasSheet('archive')).toBe(false);
		expect(spriteRenderer.getLoadedSheetIds()).toEqual(['actor']);
		expect(spriteRenderer.getManifest()?.sheets).toHaveLength(2);
	});

	it('preserves the previous committed set when a strict reload fails', async () => {
		const stable = sheet('stable');
		const broken = sheet('broken');
		let current = manifest(stable);
		const spriteRenderer = renderer({
			fetchManifest: async () => current,
			loadSheet: async (definition) => {
				if (definition.id === 'broken') throw new Error('decode failed');
				return loaded(definition);
			},
		});

		await spriteRenderer.loadManifest('stable.json');
		current = manifest(broken);

		await expect(spriteRenderer.loadManifest('broken.json')).rejects.toBeInstanceOf(
			SpriteManifestLoadError
		);
		expect(spriteRenderer.hasSheet('stable')).toBe(true);
		expect(spriteRenderer.hasSheet('broken')).toBe(false);
		expect(spriteRenderer.getLastLoadReport()).toMatchObject({
			committed: false,
			failures: [{ sheetId: 'broken', file: 'assets/sprites/broken.png' }],
		});
	});

	it('can explicitly commit a partial diagnostic load', async () => {
		const actor = sheet('actor');
		const broken = sheet('broken');
		const spriteRenderer = renderer({
			fetchManifest: async () => manifest(actor, broken),
			loadSheet: async (definition) => {
				if (definition.id === 'broken') throw new Error('decode failed');
				return loaded(definition);
			},
		});

		const report = await spriteRenderer.loadManifest('partial.json', { allowPartial: true });

		expect(report).toMatchObject({
			loadedSheetIds: ['actor'],
			failures: [{ sheetId: 'broken' }],
			allowPartial: true,
			committed: true,
		});
		expect(spriteRenderer.hasSheet('actor')).toBe(true);
		expect(spriteRenderer.hasSheet('broken')).toBe(false);
	});

	it('reuses unchanged decoded sheets without reopening image work', async () => {
		let current = manifest(sheet('actor'), sheet('prop'));
		let decodeCount = 0;
		const progress: SpriteManifestLoadProgress[] = [];
		const spriteRenderer = renderer({
			fetchManifest: async () => current,
			loadSheet: async (definition) => {
				decodeCount += 1;
				return loaded(definition);
			},
		});

		const first = await spriteRenderer.loadManifest('sprites.json');
		const previousActor = spriteRenderer.getSheet('actor');
		current = manifest(sheet('actor'), sheet('prop'));
		const second = await spriteRenderer.loadManifest('sprites.json', {
			onProgress: (event) => progress.push(event),
		});

		expect(first).toMatchObject({
			decodedSheetIds: ['actor', 'prop'],
			reloadSheetIds: ['actor', 'prop'],
			reusedSheetIds: [],
			addedSheetIds: ['actor', 'prop'],
			totalAttempts: 2,
		});
		expect(second).toMatchObject({
			loadedSheetIds: ['actor', 'prop'],
			decodedSheetIds: [],
			reloadSheetIds: [],
			reusedSheetIds: ['actor', 'prop'],
			addedSheetIds: [],
			removedSheetIds: [],
			changedSheetIds: [],
			unchangedSheetIds: ['actor', 'prop'],
			forcedReloadSheetIds: [],
			totalAttempts: 0,
			committed: true,
		});
		expect(decodeCount).toBe(2);
		expect(spriteRenderer.getSheet('actor')).not.toBe(previousActor);
		expect(spriteRenderer.getSheet('actor')?.image).toBe(previousActor?.image);
		expect(progress.map((event) => event.phase)).toEqual([
			'manifest-ready',
			'sheet-reused',
			'sheet-reused',
			'complete',
		]);
		expect(progress.map((event) => event.completedSheets)).toEqual([0, 1, 2, 2]);
	});

	it('reloads only added and changed contracts while evicting removals on commit', async () => {
		const stable = sheet('stable');
		const changedV1 = sheet('changed', { revision: 'v1' });
		const removed = sheet('removed');
		let current = manifest(stable, changedV1, removed);
		const decoded: string[] = [];
		const spriteRenderer = renderer({
			fetchManifest: async () => current,
			loadSheet: async (definition) => {
				decoded.push(definition.id);
				return loaded(definition);
			},
		});

		await spriteRenderer.loadManifest('sprites.json');
		decoded.length = 0;
		current = manifest(sheet('stable'), sheet('changed', { revision: 'v2' }), sheet('added'));
		const report = await spriteRenderer.loadManifest('sprites.json');

		expect(decoded).toEqual(['changed', 'added']);
		expect(report).toMatchObject({
			loadedSheetIds: ['stable', 'changed', 'added'],
			decodedSheetIds: ['changed', 'added'],
			reloadSheetIds: ['changed', 'added'],
			reusedSheetIds: ['stable'],
			addedSheetIds: ['added'],
			removedSheetIds: ['removed'],
			changedSheetIds: ['changed'],
			unchangedSheetIds: ['stable'],
			totalAttempts: 2,
		});
		expect(spriteRenderer.hasSheet('removed')).toBe(false);
	});

	it('supports forced and globally disabled cache reuse', async () => {
		let current = manifest(sheet('actor'), sheet('prop'));
		const decoded: string[] = [];
		const spriteRenderer = renderer({
			fetchManifest: async () => current,
			loadSheet: async (definition) => {
				decoded.push(definition.id);
				return loaded(definition);
			},
		});

		await spriteRenderer.loadManifest('sprites.json');
		decoded.length = 0;
		current = manifest(sheet('actor'), sheet('prop'));
		const forced = await spriteRenderer.loadManifest('sprites.json', {
			forceReloadSheetIds: ['actor', 'unknown'],
		});

		expect(decoded).toEqual(['actor']);
		expect(forced).toMatchObject({
			decodedSheetIds: ['actor'],
			reloadSheetIds: ['actor'],
			reusedSheetIds: ['prop'],
			forcedReloadSheetIds: ['actor'],
			changedSheetIds: [],
			unchangedSheetIds: ['actor', 'prop'],
		});

		decoded.length = 0;
		const uncached = await spriteRenderer.loadManifest('sprites.json', { reuseUnchanged: false });
		expect(decoded).toEqual(['actor', 'prop']);
		expect(uncached).toMatchObject({
			decodedSheetIds: ['actor', 'prop'],
			reloadSheetIds: ['actor', 'prop'],
			reusedSheetIds: [],
			reuseUnchanged: false,
			totalAttempts: 2,
		});
	});

	it('preserves the complete previous cache when one changed sheet fails strictly', async () => {
		const stable = sheet('stable');
		const mutableV1 = sheet('mutable', { revision: 'v1' });
		let current = manifest(stable, mutableV1);
		let failMutable = false;
		const spriteRenderer = renderer({
			fetchManifest: async () => current,
			loadSheet: async (definition) => {
				if (definition.id === 'mutable' && failMutable) throw new Error('new atlas failed');
				return loaded(definition);
			},
		});

		await spriteRenderer.loadManifest('sprites.json');
		const previousStable = spriteRenderer.getSheet('stable');
		const previousMutable = spriteRenderer.getSheet('mutable');
		current = manifest(sheet('stable'), sheet('mutable', { revision: 'v2' }));
		failMutable = true;

		let error: SpriteManifestLoadError | undefined;
		try {
			await spriteRenderer.loadManifest('sprites.json');
		} catch (reason) {
			error = reason as SpriteManifestLoadError;
		}

		expect(error).toBeInstanceOf(SpriteManifestLoadError);
		expect(error?.report).toMatchObject({
			reusedSheetIds: ['stable'],
			decodedSheetIds: [],
			reloadSheetIds: ['mutable'],
			changedSheetIds: ['mutable'],
			unchangedSheetIds: ['stable'],
			committed: false,
		});
		expect(spriteRenderer.getSheet('stable')).toBe(previousStable);
		expect(spriteRenderer.getSheet('mutable')).toBe(previousMutable);
	});

	it('prevents an older asynchronous request from replacing a newer manifest', async () => {
		const slow = sheet('slow');
		const fast = sheet('fast');
		const slowLoad = deferred<LoadedSheet>();
		const spriteRenderer = renderer({
			fetchManifest: async (url) => (url === 'slow.json' ? manifest(slow) : manifest(fast)),
			loadSheet: async (definition) => {
				if (definition.id === 'slow') return slowLoad.promise;
				return loaded(definition);
			},
		});

		const first = spriteRenderer.loadManifest('slow.json');
		const second = await spriteRenderer.loadManifest('fast.json');
		slowLoad.resolve(loaded(slow));
		const stale = await first;

		expect(second).toMatchObject({ committed: true, stale: false, loadedSheetIds: ['fast'] });
		expect(stale).toMatchObject({ committed: false, stale: true, loadedSheetIds: ['slow'] });
		expect(spriteRenderer.hasSheet('fast')).toBe(true);
		expect(spriteRenderer.hasSheet('slow')).toBe(false);
	});

	it('actively aborts cooperative image work when a newer request supersedes it', async () => {
		const slow = sheet('slow');
		const fast = sheet('fast');
		const started = deferred<void>();
		let observedSignal: AbortSignal | undefined;
		const spriteRenderer = renderer({
			fetchManifest: async (url) => (url === 'slow.json' ? manifest(slow) : manifest(fast)),
			loadSheet: async (definition, _ctx, options) => {
				if (definition.id !== 'slow') return loaded(definition);
				observedSignal = options?.signal;
				started.resolve(undefined);
				return new Promise<LoadedSheet>((_resolve, reject) => {
					observedSignal?.addEventListener(
						'abort',
						() => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
						{ once: true }
					);
				});
			},
		});

		const first = spriteRenderer.loadManifest('slow.json');
		await started.promise;
		const second = await spriteRenderer.loadManifest('fast.json');
		const stale = await first;

		expect(observedSignal?.aborted).toBe(true);
		expect(second).toMatchObject({ committed: true, loadedSheetIds: ['fast'] });
		expect(stale).toMatchObject({
			committed: false,
			stale: true,
			failures: [{ sheetId: 'slow', error: { name: 'AbortError' } }],
		});
	});

	it('bounds concurrent sheet decoding while preserving manifest report order', async () => {
		const sheets = Array.from({ length: 7 }, (_, index) => sheet(`sheet-${index}`));
		let active = 0;
		let maximumActive = 0;
		const spriteRenderer = renderer({
			fetchManifest: async () => manifest(...sheets),
			loadSheet: async (definition) => {
				active += 1;
				maximumActive = Math.max(maximumActive, active);
				await new Promise((resolve) => setTimeout(resolve, 1));
				active -= 1;
				return loaded(definition);
			},
		});

		const report = await spriteRenderer.loadManifest('bounded.json', { maxConcurrent: 2 });

		expect(maximumActive).toBe(2);
		expect(report.maxConcurrent).toBe(2);
		expect(report.loadedSheetIds).toEqual(sheets.map((definition) => definition.id));
		expect(spriteRenderer.getLoadedSheetIds()).toEqual(sheets.map((definition) => definition.id));
	});

	it('retries transient failures and emits monotonic structured progress', async () => {
		const flaky = sheet('flaky');
		let attempts = 0;
		const progress: SpriteManifestLoadProgress[] = [];
		const spriteRenderer = renderer({
			fetchManifest: async () => manifest(flaky),
			loadSheet: async (definition) => {
				attempts += 1;
				if (attempts < 3) throw new Error(`transient-${attempts}`);
				return loaded(definition);
			},
		});

		const report = await spriteRenderer.loadManifest('retry.json', {
			maxRetries: 2,
			retryDelayMs: 0,
			onProgress: (event) => progress.push(event),
		});

		expect(attempts).toBe(3);
		expect(report).toMatchObject({
			loadedSheetIds: ['flaky'],
			maxRetries: 2,
			totalAttempts: 3,
			committed: true,
		});
		expect(progress.map((event) => event.phase)).toEqual([
			'manifest-ready',
			'sheet-start',
			'sheet-retry',
			'sheet-start',
			'sheet-retry',
			'sheet-start',
			'sheet-success',
			'complete',
		]);
		expect(progress.map((event) => event.completedSheets)).toEqual([0, 0, 0, 0, 0, 0, 1, 1]);
		expect(progress.filter((event) => event.phase === 'sheet-start').map((event) => event.attempt)).toEqual([
			1, 2, 3,
		]);
	});

	it('does not retry deterministic atlas geometry failures', async () => {
		const broken = sheet('broken');
		let attempts = 0;
		const phases: string[] = [];
		const dimensionError = Object.assign(new Error('wrong dimensions'), {
			name: 'SpriteSheetDimensionLoadError',
		});
		const spriteRenderer = renderer({
			fetchManifest: async () => manifest(broken),
			loadSheet: async () => {
				attempts += 1;
				throw dimensionError;
			},
		});

		const report = await spriteRenderer.loadManifest('dimensions.json', {
			allowPartial: true,
			maxRetries: 4,
			retryDelayMs: 0,
			onProgress: (event) => phases.push(event.phase),
		});

		expect(attempts).toBe(1);
		expect(report).toMatchObject({
			maxRetries: 4,
			totalAttempts: 1,
			failures: [{ sheetId: 'broken', attempts: 1, error: dimensionError }],
			committed: true,
		});
		expect(phases).toEqual(['manifest-ready', 'sheet-start', 'sheet-failure', 'complete']);
	});

	it('isolates progress observer failures from the loading transaction', async () => {
		const actor = sheet('actor');
		let notifications = 0;
		const spriteRenderer = renderer({
			fetchManifest: async () => manifest(actor),
			loadSheet: async (definition) => loaded(definition),
		});

		const report = await spriteRenderer.loadManifest('observer.json', {
			onProgress: () => {
				notifications += 1;
				throw new Error('observer failed');
			},
		});

		expect(notifications).toBeGreaterThan(1);
		expect(report).toMatchObject({ committed: true, loadedSheetIds: ['actor'] });
	});

	it('cancels pending loads and clears all committed lifecycle state', async () => {
		const actor = sheet('actor');
		const pending = deferred<LoadedSheet>();
		const spriteRenderer = renderer({
			fetchManifest: async () => manifest(actor),
			loadSheet: async () => pending.promise,
		});

		const request = spriteRenderer.loadManifest('sprites.json');
		spriteRenderer.clear();
		pending.resolve(loaded(actor));

		expect(await request).toMatchObject({ committed: false, stale: true });
		expect(spriteRenderer.getManifest()).toBeNull();
		expect(spriteRenderer.getLastLoadReport()).toBeNull();
		expect(spriteRenderer.hasSheet('actor')).toBe(false);
	});
});
