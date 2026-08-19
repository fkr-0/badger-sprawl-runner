import { diffSnapshots } from '@arcade/runtime/testing';
import type { SnapshotDiffEntry, SnapshotValue } from '@arcade/runtime/testing';

export interface ReplayDiffInput {
	left: SnapshotValue;
	right: SnapshotValue;
	ignorePaths?: readonly string[];
}

export type ReplayDiffEntry = SnapshotDiffEntry;

export function diffReplaySnapshots(input: ReplayDiffInput): ReplayDiffEntry[] {
	return diffSnapshots(input);
}
