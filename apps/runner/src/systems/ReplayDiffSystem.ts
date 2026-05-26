import { stableSnapshot, type SnapshotValue } from '@badger/platformer-core';

export interface ReplayDiffInput {
	left: SnapshotValue;
	right: SnapshotValue;
	ignorePaths?: readonly string[];
}

export interface ReplayDiffEntry {
	path: string;
	left: SnapshotValue | undefined;
	right: SnapshotValue | undefined;
}

function pathMatches(path: string, ignorePaths: readonly string[]): boolean {
	return ignorePaths.some((ignore) => path === ignore || path.startsWith(`${ignore}.`) || path.startsWith(`${ignore}[`));
}

function keysFor(left: SnapshotValue, right: SnapshotValue): string[] {
	const keys = new Set<string>();
	if (left && typeof left === 'object' && !Array.isArray(left)) for (const key of Object.keys(left)) keys.add(key);
	if (right && typeof right === 'object' && !Array.isArray(right)) for (const key of Object.keys(right)) keys.add(key);
	return [...keys].sort((a, b) => a.localeCompare(b));
}

function diffRecursive(left: SnapshotValue | undefined, right: SnapshotValue | undefined, path: string, ignorePaths: readonly string[], entries: ReplayDiffEntry[]): void {
	if (path && pathMatches(path, ignorePaths)) return;
	if (JSON.stringify(left) === JSON.stringify(right)) return;
	const leftIsArray = Array.isArray(left);
	const rightIsArray = Array.isArray(right);
	if (leftIsArray || rightIsArray) {
		const max = Math.max(leftIsArray ? left.length : 0, rightIsArray ? right.length : 0);
		for (let index = 0; index < max; index += 1) diffRecursive(leftIsArray ? left[index] : undefined, rightIsArray ? right[index] : undefined, `${path}[${index}]`, ignorePaths, entries);
		return;
	}
	const leftObj = left && typeof left === 'object';
	const rightObj = right && typeof right === 'object';
	if (leftObj || rightObj) {
		for (const key of keysFor(left, right)) diffRecursive(leftObj ? left[key] : undefined, rightObj ? right[key] : undefined, path ? `${path}.${key}` : key, ignorePaths, entries);
		return;
	}
	entries.push({ path, left, right });
}

export function diffReplaySnapshots(input: ReplayDiffInput): ReplayDiffEntry[] {
	const left = stableSnapshot(input.left);
	const right = stableSnapshot(input.right);
	const entries: ReplayDiffEntry[] = [];
	diffRecursive(left, right, '', input.ignorePaths ?? [], entries);
	return entries.sort((a, b) => a.path.localeCompare(b.path));
}
