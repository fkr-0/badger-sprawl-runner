import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRunnerApp } from './RunnerApp';
import { TitleScene } from './scenes/TitleScene';
import { TrainingScene } from './scenes/TrainingScene';
import { VersusScene } from './scenes/VersusScene';

function installWindowStub(): void {
	const globalWithWindow = globalThis as typeof globalThis & {
		window?: {
			addEventListener: () => void;
			removeEventListener: () => void;
			dispatchEvent: () => boolean;
			localStorage: Storage;
		};
		CustomEvent?: typeof CustomEvent;
		requestAnimationFrame?: (callback: FrameRequestCallback) => number;
		cancelAnimationFrame?: (handle: number) => void;
	};
	globalWithWindow.window ??= {
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => true,
		localStorage: createStorageStub(),
	};
	globalWithWindow.CustomEvent ??= class TestCustomEvent<T = unknown> extends Event {
		detail: T;
		constructor(type: string, init?: CustomEventInit<T>) {
			super(type);
			this.detail = init?.detail as T;
		}
	} as typeof CustomEvent;
	globalWithWindow.requestAnimationFrame ??= () => 0;
	globalWithWindow.cancelAnimationFrame ??= () => {};
}

function createStorageStub(): Storage {
	const values = new Map<string, string>();
	return {
		get length(): number {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key) => values.get(key) ?? null,
		key: (index) => Array.from(values.keys())[index] ?? null,
		removeItem: (key) => values.delete(key),
		setItem: (key, value) => values.set(key, value),
	} as Storage;
}

function createContextStub(): CanvasRenderingContext2D {
	const gradient = { addColorStop: () => {} } as CanvasGradient;
	return {
		canvas: { width: 960, height: 540 },
		clearRect: vi.fn(),
		createLinearGradient: vi.fn(() => gradient),
		fillRect: vi.fn(),
		strokeRect: vi.fn(),
		fillText: vi.fn(),
		save: vi.fn(),
		restore: vi.fn(),
		translate: vi.fn(),
		scale: vi.fn(),
		beginPath: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		stroke: vi.fn(),
		arc: vi.fn(),
		fill: vi.fn(),
	} as unknown as CanvasRenderingContext2D;
}

function createCanvasStub(ctx = createContextStub()): HTMLCanvasElement {
	return {
		width: 960,
		height: 540,
		getContext: (kind: string) => (kind === '2d' ? ctx : null),
	} as HTMLCanvasElement;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('RunnerApp scene shell', () => {
	it('starts on TitleScene and routes menu selections through SceneManager', () => {
		installWindowStub();
		const app = createRunnerApp(createCanvasStub());

		app.start();
		expect(app.getCurrentScene()).toBeInstanceOf(TitleScene);

		app.routeMode('training');
		expect(app.getCurrentScene()).toBeInstanceOf(TrainingScene);

		app.routeMode('versus');
		expect(app.getCurrentScene()).toBeInstanceOf(VersusScene);
	});

	it('starts a fixed-step render loop that updates and renders the current scene', () => {
		installWindowStub();
		let frameCallback: FrameRequestCallback | null = null;
		vi.stubGlobal('performance', { now: () => 0 });
		vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
			frameCallback = callback;
			return 41;
		}));
		vi.stubGlobal('cancelAnimationFrame', vi.fn());

		const ctx = createContextStub();
		const app = createRunnerApp(createCanvasStub(ctx));
		app.start();
		const scene = app.getCurrentScene();
		if (!scene) throw new Error('expected current scene after start');
		const updateSpy = vi.spyOn(scene, 'update');
		const renderSpy = vi.spyOn(scene, 'render');

		expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
		expect(frameCallback).toBeTypeOf('function');
		frameCallback?.(1000 / 60);

		expect(updateSpy).toHaveBeenCalledWith(1 / 60);
		expect(renderSpy).toHaveBeenCalledOnce();
		expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 960, 540);
	});
});
