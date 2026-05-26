import type { Rect } from '../types';
import { aabb } from './aabb';

export interface SpatialBody extends Rect {
	id: string;
	layer?: string;
	mask?: string[];
}

export interface SpatialIndex {
	cellSize: number;
	cells: Map<string, SpatialBody[]>;
	bodies: SpatialBody[];
}

export interface SpatialPair {
	a: SpatialBody;
	b: SpatialBody;
}

function cellRange(rect: Rect, cellSize: number): { minX: number; maxX: number; minY: number; maxY: number } {
	return {
		minX: Math.floor(rect.x / cellSize),
		maxX: Math.floor((rect.x + rect.w) / cellSize),
		minY: Math.floor(rect.y / cellSize),
		maxY: Math.floor((rect.y + rect.h) / cellSize),
	};
}

function cellKey(x: number, y: number): string {
	return `${x}:${y}`;
}

function canCollide(a: SpatialBody, b: SpatialBody): boolean {
	if (a.layer && b.mask && !b.mask.includes(a.layer)) return false;
	if (b.layer && a.mask && !a.mask.includes(b.layer)) return false;
	return true;
}

function pairKey(a: SpatialBody, b: SpatialBody): string {
	return a.id < b.id ? `${a.id}\u0000${b.id}` : `${b.id}\u0000${a.id}`;
}

export function buildSpatialIndex(bodies: readonly SpatialBody[], cellSize: number): SpatialIndex {
	if (!Number.isFinite(cellSize) || cellSize <= 0) throw new Error(`Invalid spatial cell size: ${cellSize}`);
	const sortedBodies = [...bodies].sort((a, b) => a.id.localeCompare(b.id));
	const cells = new Map<string, SpatialBody[]>();

	for (const body of sortedBodies) {
		const range = cellRange(body, cellSize);
		for (let y = range.minY; y <= range.maxY; y += 1) {
			for (let x = range.minX; x <= range.maxX; x += 1) {
				const key = cellKey(x, y);
				const cell = cells.get(key) ?? [];
				cell.push(body);
				cells.set(key, cell);
			}
		}
	}

	for (const [key, cell] of cells) {
		cells.set(key, cell.sort((a, b) => a.id.localeCompare(b.id)));
	}

	return { cellSize, cells, bodies: sortedBodies };
}

export function querySpatialIndex(index: SpatialIndex, rect: Rect): SpatialBody[] {
	const range = cellRange(rect, index.cellSize);
	const seen = new Map<string, SpatialBody>();
	for (let y = range.minY; y <= range.maxY; y += 1) {
		for (let x = range.minX; x <= range.maxX; x += 1) {
			for (const body of index.cells.get(cellKey(x, y)) ?? []) {
				if (aabb(rect, body)) seen.set(body.id, body);
			}
		}
	}
	return [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function spatialCollisionPairs(index: SpatialIndex): SpatialPair[] {
	const pairs = new Map<string, SpatialPair>();
	for (const cell of index.cells.values()) {
		for (let i = 0; i < cell.length; i += 1) {
			for (let j = i + 1; j < cell.length; j += 1) {
				const a = cell[i] as SpatialBody;
				const b = cell[j] as SpatialBody;
				if (!canCollide(a, b) || !aabb(a, b)) continue;
				const first = a.id < b.id ? a : b;
				const second = a.id < b.id ? b : a;
				pairs.set(pairKey(first, second), { a: first, b: second });
			}
		}
	}
	return [...pairs.values()].sort((left, right) => pairKey(left.a, left.b).localeCompare(pairKey(right.a, right.b)));
}
