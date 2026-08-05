import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { type Scene, type SceneContext, SceneManager } from './SceneManager';

function collectTsFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			out.push(...collectTsFiles(path));
		} else if (path.endsWith('.ts') && !path.endsWith('.test.ts')) {
			out.push(path);
		}
	}
	return out;
}

describe('SceneManager renderer boundary', () => {
	it('uses the concrete Renderer type rather than unknown and scene-local casts', () => {
		const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
		const files = [
			join(srcRoot, 'engine/SceneManager.ts'),
			...collectTsFiles(join(srcRoot, 'scenes')),
		];
		const offenders = files.flatMap((file) => {
			const text = readFileSync(file, 'utf8');
			const problems: string[] = [];
			if (text.includes('renderer: unknown')) problems.push('renderer: unknown');
			if (text.includes('renderer?: unknown')) problems.push('renderer?: unknown');
			if (text.includes('as Renderer')) problems.push('as Renderer');
			return problems.map((problem) => `${relative(srcRoot, file)}: ${problem}`);
		});

		expect(offenders).toEqual([]);
	});
});

describe('SceneManager lifecycle', () => {
	it('exits every stacked scene from top to bottom when cleared', () => {
		const exitOrder: string[] = [];
		const scene = (name: string): Scene => ({
			name,
			onEnter: vi.fn(),
			onExit: () => exitOrder.push(name),
			update: vi.fn(),
			render: vi.fn(),
		});
		const manager = new SceneManager({} as SceneContext);

		manager.push(scene('base'));
		manager.push(scene('overlay'));
		manager.clear();

		expect(exitOrder).toEqual(['overlay', 'base']);
		expect(manager.getCurrent()).toBeUndefined();
	});
});
