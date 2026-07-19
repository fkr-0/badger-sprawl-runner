import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { ARCADE_CORE_VERSION as COMPAT_CORE_VERSION } from '../../../../vendor/arcade-core.mjs';
import {
	ARCADE_PIXI_RUNTIME_VERSION as COMPAT_PIXI_VERSION
} from '../../../../vendor/arcade-pixi-runtime.mjs';
import { ARCADE_RUNTIME_VERSION as SHARED_RUNTIME_VERSION } from '../../../../vendor/arcade-runtime.mjs';
import {
	BADGER_ARCADE_PIXI_RUNTIME_VERSION,
	BADGER_ARCADE_RUNTIME_VERSION,
	BADGER_CANVAS_PASS_TO_PIXI_LAYER,
	BADGER_PIXI_BRIDGE_PASSES,
	BADGER_PIXI_LAYERS,
	BADGER_PIXI_RENDER_PLAN
} from './ArcadeRuntimeContract';

describe('shared Pixi runtime contract', () => {
	it('pins the common runtime and preserves deterministic pass order', () => {
		expect(BADGER_ARCADE_RUNTIME_VERSION).toBe(SHARED_RUNTIME_VERSION);
		expect(BADGER_ARCADE_PIXI_RUNTIME_VERSION).toBe(BADGER_ARCADE_RUNTIME_VERSION);
		expect(BADGER_PIXI_LAYERS).toEqual([
			'backdrop',
			'world-back',
			'world',
			'actors',
			'projectiles',
			'effects',
			'world-front',
			'hud',
			'overlay'
		]);
		expect(BADGER_CANVAS_PASS_TO_PIXI_LAYER.parallax).toBe('world-back');
		expect(BADGER_PIXI_RENDER_PLAN.map(({ name, layer }) => [name, layer])).toEqual([
			['stage-backdrop', 'backdrop'],
			['parallax', 'world-back'],
			['terrain', 'world'],
			['actors', 'actors'],
			['projectiles', 'projectiles'],
			['vfx', 'effects'],
			['foreground', 'world-front'],
			['runner-hud', 'hud'],
			['scene-ui', 'overlay']
		]);
		expect(BADGER_PIXI_BRIDGE_PASSES.map((pass) => pass.name)).toEqual([
			'stage-backdrop',
			'parallax',
			'terrain',
			'foreground',
			'runner-hud',
			'scene-ui'
		]);

		const runtimeModule = readFileSync(
			new URL('../../../../vendor/arcade-runtime.mjs', import.meta.url)
		);
		const metadata = JSON.parse(
			readFileSync(
				new URL('../../../../vendor/arcade-runtime.meta.json', import.meta.url),
				'utf8'
			)
		) as { package: string; version: string; sha256: string; typesSha256: string };
		expect(metadata.package).toBe('@arcade/runtime');
		expect(metadata.version).toBe(BADGER_ARCADE_RUNTIME_VERSION);
		expect(createHash('sha256').update(runtimeModule).digest('hex')).toBe(metadata.sha256);
		const runtimeTypes = readFileSync(
			new URL('../../../../vendor/arcade-runtime.d.mts', import.meta.url)
		);
		expect(createHash('sha256').update(runtimeTypes).digest('hex')).toBe(metadata.typesSha256);

		expect(COMPAT_CORE_VERSION).toBe(BADGER_ARCADE_RUNTIME_VERSION);
		expect(COMPAT_PIXI_VERSION).toBe(BADGER_ARCADE_RUNTIME_VERSION);
		expect(
			readFileSync(new URL('../../../../vendor/arcade-core.mjs', import.meta.url), 'utf8')
		).toContain("export * from './arcade-runtime.mjs'");
		expect(
			readFileSync(
				new URL('../../../../vendor/arcade-pixi-runtime.mjs', import.meta.url),
				'utf8'
			)
		).toContain("export * from './arcade-runtime.mjs'");
		expect(
			existsSync(new URL('../../../../vendor/arcade-core.meta.json', import.meta.url))
		).toBe(false);
		expect(
			existsSync(new URL('../../../../vendor/arcade-pixi-runtime.meta.json', import.meta.url))
		).toBe(false);
	});
});
