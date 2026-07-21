import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	auditSpriteAtlasDimensions,
	auditSpriteManifestDimensions,
	createSpriteAtlasAssemblyPlan,
	deriveSpriteAtlasLayout,
} from '../production';
import type { SpriteManifest, SpriteSheet } from '../types';

function pngDimensions(path: string): { width: number; height: number } | null {
	try {
		const header = readFileSync(path).subarray(0, 24);
		if (header.length < 24 || header.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
		return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
	} catch {
		return null;
	}
}

describe('sprite atlas production geometry', () => {
	it('derives row-per-animation dimensions and unused cells', () => {
		const sheet: SpriteSheet = {
			id: 'enemy',
			file: 'enemy.png',
			frameSize: [48, 48],
			animations: {
				idle: { frames: 4, fps: 8 },
				move: { frames: 6, fps: 12 },
				attack: { frames: 5, fps: 16 },
			},
		};
		const layout = deriveSpriteAtlasLayout(sheet);
		const plan = createSpriteAtlasAssemblyPlan(sheet);
		expect(layout).toMatchObject({
			mode: 'animation-rows',
			columns: 6,
			rows: 3,
			expectedWidth: 288,
			expectedHeight: 144,
		});
		expect(plan.usedCellCount).toBe(15);
		expect(plan.unusedCellCount).toBe(3);
	});

	it('deduplicates explicitly shared grid cells', () => {
		const sheet: SpriteSheet = {
			id: 'shared-grid',
			file: 'shared.png',
			frameSize: [32, 32],
			grid: { columns: 2, rows: 2 },
			animations: {
				idle: { frames: 2, fps: 8, order: [0, 1] },
				blink: { frames: 2, fps: 8, order: [0, 2] },
			},
		};
		const plan = createSpriteAtlasAssemblyPlan(sheet);
		expect(plan.layout.expectedWidth).toBe(64);
		expect(plan.layout.expectedHeight).toBe(64);
		expect(plan.usedCellCount).toBe(3);
		expect(plan.cells[0]?.references).toHaveLength(2);
	});

	it('reports alignment and exact-size failures', () => {
		const sheet: SpriteSheet = {
			id: 'tiles',
			file: 'tiles.png',
			frameSize: [32, 32],
			grid: { columns: 4, rows: 2 },
			animations: { tiles: { frames: 8, fps: 1, order: [0, 1, 2, 3, 4, 5, 6, 7] } },
		};
		const audit = auditSpriteAtlasDimensions(sheet, { width: 129, height: 64 });
		expect(audit.ok).toBe(false);
		expect(audit.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
			'width-not-frame-aligned',
			'width-has-extra-space',
		]);
	});
});

describe('production sprite assets', () => {
	it('match every current manifest sheet geometry exactly', () => {
		const root = fileURLToPath(new URL('../../../../', import.meta.url));
		const manifest = JSON.parse(
			readFileSync(new URL('../../../../data/sprites.json', import.meta.url), 'utf8')
		) as SpriteManifest;
		const audit = auditSpriteManifestDimensions(manifest, (sheet) =>
			pngDimensions(`${root}${sheet.file}`)
		);
		expect(audit.diagnostics).toEqual([]);
		expect(audit.sheets).toHaveLength(manifest.sheets?.length ?? manifest.spriteSheets?.length ?? 71);
		expect(audit.ok).toBe(true);
	});
});
