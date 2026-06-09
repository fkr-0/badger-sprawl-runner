import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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
		const root = process.cwd();
		const files = [
			join(root, 'src/engine/SceneManager.ts'),
			...collectTsFiles(join(root, 'src/scenes')),
		];
		const offenders = files.flatMap((file) => {
			const text = readFileSync(file, 'utf8');
			const problems: string[] = [];
			if (text.includes('renderer: unknown')) problems.push('renderer: unknown');
			if (text.includes('renderer?: unknown')) problems.push('renderer?: unknown');
			if (text.includes('as Renderer')) problems.push('as Renderer');
			return problems.map((problem) => `${file.replace(`${root}/`, '')}: ${problem}`);
		});

		expect(offenders).toEqual([]);
	});
});
