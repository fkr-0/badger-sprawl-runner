import { describe, expect, it } from 'vitest';
import {
	bindLoadedSpriteSheet,
	loadSpriteSheet,
	SpriteSheetDimensionLoadError,
	type SpriteSheetLoadOptions,
} from '../loader';
import type { SpriteSheet } from '../types';

const sheet: SpriteSheet = {
	id: 'actor',
	file: 'actor.png',
	frameSize: [16, 16],
	animations: { idle: { frames: 2, fps: 8 } },
};

class FakeImage {
	onload: ((this: GlobalEventHandlers, event: Event) => unknown) | null = null;
	onerror: OnErrorEventHandler = null;
	naturalWidth = 0;
	naturalHeight = 0;
	width = 0;
	height = 0;
	assignedSources: string[] = [];
	private source = '';

	constructor(
		private readonly dimensions: readonly [number, number],
		private readonly autoLoad = true
	) {}

	get src(): string {
		return this.source;
	}

	set src(value: string) {
		this.source = value;
		this.assignedSources.push(value);
		if (!value || !this.autoLoad) return;
		queueMicrotask(() => {
			this.naturalWidth = this.dimensions[0];
			this.naturalHeight = this.dimensions[1];
			this.width = this.dimensions[0];
			this.height = this.dimensions[1];
			this.onload?.call(this as unknown as GlobalEventHandlers, new Event('load'));
		});
	}
}

function options(image: FakeImage, signal?: AbortSignal): SpriteSheetLoadOptions {
	return { imageFactory: () => image as unknown as HTMLImageElement, signal };
}

describe('browser sprite sheet loader', () => {
	it('loads an exactly sized image and retains the shared draw contract', async () => {
		const image = new FakeImage([32, 16]);
		const loaded = await loadSpriteSheet(
			sheet,
			{} as CanvasRenderingContext2D,
			options(image)
		);

		expect(loaded.sheet).toBe(sheet);
		expect(loaded.image).toBe(image);
		expect(image.assignedSources).toEqual(['actor.png']);
		expect(typeof loaded.drawFrame).toBe('function');
	});

	it('rebinds a decoded image to a fresh normalized contract without decoding again', () => {
		const image = new FakeImage([32, 16]);
		const nextSheet: SpriteSheet = {
			...sheet,
			source: { revision: 'v2' },
		};
		const rebound = bindLoadedSpriteSheet(nextSheet, image as unknown as HTMLImageElement);

		expect(rebound).toMatchObject({ sheet: nextSheet, image });
		expect(Object.isFrozen(rebound)).toBe(true);
		expect(typeof rebound.drawFrame).toBe('function');
		expect(image.assignedSources).toEqual([]);
	});

	it('rejects decoded images whose geometry does not match the manifest', async () => {
		const image = new FakeImage([31, 16]);
		const request = loadSpriteSheet(
			sheet,
			{} as CanvasRenderingContext2D,
			options(image)
		);

		await expect(request).rejects.toBeInstanceOf(SpriteSheetDimensionLoadError);
		await expect(request).rejects.toMatchObject({
			audit: {
				ok: false,
				layout: { expectedWidth: 32, expectedHeight: 16 },
				actual: { width: 31, height: 16 },
			},
		});
	});

	it('aborts pending image work and detaches its event handlers', async () => {
		const image = new FakeImage([32, 16], false);
		const controller = new AbortController();
		const request = loadSpriteSheet(
			sheet,
			{} as CanvasRenderingContext2D,
			options(image, controller.signal)
		);

		controller.abort();

		await expect(request).rejects.toMatchObject({ name: 'AbortError' });
		expect(image.assignedSources).toEqual(['actor.png', '']);
		expect(image.onload).toBeNull();
		expect(image.onerror).toBeNull();
	});

	it('can explicitly disable geometry validation for diagnostic tooling', async () => {
		const image = new FakeImage([31, 16]);
		const loaded = await loadSpriteSheet(sheet, {} as CanvasRenderingContext2D, {
			...options(image),
			validateDimensions: false,
		});

		expect(loaded.image).toBe(image);
	});
});
