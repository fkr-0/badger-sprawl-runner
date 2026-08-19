/** Shared arcade-runtime AABB collision test. */

import { aabbOverlap } from '@arcade/runtime/core';

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export function aabb(a: Rect, b: Rect): boolean {
	return aabbOverlap(a, b);
}
