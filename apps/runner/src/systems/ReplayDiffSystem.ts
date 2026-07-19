import { diffSnapshots } from '../../../../vendor/arcade-runtime.mjs';
import type {
	SnapshotDiffEntry,
	SnapshotValue,
} from '../../../../vendor/arcade-runtime.mjs';

export interface ReplayDiffInput {
	left: SnapshotValue;
	right: SnapshotValue;
	ignorePaths?: readonly string[];
}

export type ReplayDiffEntry = SnapshotDiffEntry;

export function diffReplaySnapshots(input: ReplayDiffInput): ReplayDiffEntry[] {
	return diffSnapshots(input);
}
