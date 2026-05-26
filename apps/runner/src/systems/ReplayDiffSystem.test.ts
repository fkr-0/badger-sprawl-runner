import { describe, expect, it } from 'vitest';
import { diffReplaySnapshots } from './ReplayDiffSystem';

describe('ReplayDiffSystem', () => {
	it('detects changed hp', () => {
		expect(diffReplaySnapshots({ left: { actors: [{ id: 'a', hp: 5 }] }, right: { actors: [{ id: 'a', hp: 4 }] } })).toEqual([{ path: 'actors[0].hp', left: 5, right: 4 }]);
	});

	it('detects changed projectile position', () => {
		expect(diffReplaySnapshots({ left: { projectiles: [{ id: 'p', x: 1 }] }, right: { projectiles: [{ id: 'p', x: 2 }] } })).toEqual([{ path: 'projectiles[0].x', left: 1, right: 2 }]);
	});

	it('ignores configured volatile fields', () => {
		expect(diffReplaySnapshots({ left: { frame: 1, hp: 5 }, right: { frame: 2, hp: 5 }, ignorePaths: ['frame'] })).toEqual([]);
	});

	it('uses stable diff ordering', () => {
		expect(diffReplaySnapshots({ left: { z: 1, a: 1 }, right: { z: 2, a: 2 } }).map((entry) => entry.path)).toEqual(['a', 'z']);
	});
});
