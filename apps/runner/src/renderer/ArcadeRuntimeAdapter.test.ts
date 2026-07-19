import { describe, expect, it, vi } from 'vitest';
import type {
	ArcadePixiNamespace,
	ArcadePixiRuntime
} from '../../../../vendor/arcade-pixi-runtime.mjs';
import { installBadgerCanvasBridgePasses } from './ArcadeRuntimeAdapter';

describe('Badger shared-runtime bridge adapter', () => {
	it('installs only supplied ready Canvas passes in the canonical layers', () => {
		const installed: Array<{ name: string; layer: string; create: unknown }> = [];
		const runtime = {
			addPass(name: string, options: { layer: string; create?: unknown }) {
				installed.push({ name, layer: options.layer, create: options.create });
				return { name, layerName: options.layer };
			}
		} as unknown as ArcadePixiRuntime;
		const PIXI = {
			Texture: class Texture {},
			Sprite: class Sprite {}
		} as unknown as ArcadePixiNamespace;

		const handles = installBadgerCanvasBridgePasses({
			runtime,
			PIXI,
			drawers: {
				'stage-backdrop': vi.fn(),
				parallax: vi.fn(),
				terrain: vi.fn()
			}
		});

		expect(installed.map(({ name, layer }) => [name, layer])).toEqual([
			['stage-backdrop', 'backdrop'],
			['parallax', 'world-back'],
			['terrain', 'world']
		]);
		expect(installed.every(({ create }) => typeof create === 'function')).toBe(true);
		expect(Object.keys(handles)).toEqual(['stage-backdrop', 'parallax', 'terrain']);
	});
});
