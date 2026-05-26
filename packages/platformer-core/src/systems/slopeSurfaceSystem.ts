import type { Rect } from '../types';

export interface SlopeSegment {
	id: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	materialId: string;
}

export interface SlopeMaterial {
	id: string;
	traction: number;
	slideMultiplier?: number;
}

export interface SlopeSampleInput {
	x: number;
	slopes: ReadonlyArray<SlopeSegment>;
	materials?: ReadonlyArray<SlopeMaterial>;
	gravity?: number;
}

export interface SlopeSample {
	slopeId: string;
	materialId: string;
	y: number;
	normalX: number;
	normalY: number;
	slideForce: number;
	tractionModifier: number;
}

export interface SlopeWalkerState extends Rect {
	vx: number;
	vy: number;
	onGround: boolean;
}

export interface SlopeWalkInput<T extends SlopeWalkerState> {
	body: T;
	slopes: ReadonlyArray<SlopeSegment>;
	materials?: ReadonlyArray<SlopeMaterial>;
	dt: number;
	moveX?: number;
	walkSpeed?: number;
	gravity?: number;
}

export interface SlopeWalkOutput<T extends SlopeWalkerState> {
	body: T;
	sample: SlopeSample | null;
}

function materialFor(id: string, materials: ReadonlyArray<SlopeMaterial> | undefined): SlopeMaterial {
	return materials?.find((material) => material.id === id) ?? { id, traction: 1, slideMultiplier: 1 };
}

function sampleSlopeY(slope: SlopeSegment, x: number): number | null {
	const minX = Math.min(slope.x1, slope.x2);
	const maxX = Math.max(slope.x1, slope.x2);
	if (x < minX - 1e-9 || x > maxX + 1e-9) return null;
	const dx = slope.x2 - slope.x1;
	if (dx === 0) return Math.min(slope.y1, slope.y2);
	const t = (x - slope.x1) / dx;
	return slope.y1 + (slope.y2 - slope.y1) * t;
}

function normalFor(slope: SlopeSegment): { x: number; y: number } {
	const dx = slope.x2 - slope.x1;
	const dy = slope.y2 - slope.y1;
	const length = Math.hypot(dx, dy);
	if (length === 0) return { x: 0, y: -1 };
	let x = dy / length;
	let y = -dx / length;
	if (y > 0) {
		x = -x;
		y = -y;
	}
	return { x: Number(x.toFixed(6)), y: Number(y.toFixed(6)) };
}

export function resolveSlopeSurface(input: SlopeSampleInput): SlopeSample | null {
	const candidates = input.slopes
		.map((slope) => ({ slope, y: sampleSlopeY(slope, input.x) }))
		.filter((entry): entry is { slope: SlopeSegment; y: number } => entry.y !== null)
		.sort((a, b) => a.y - b.y || a.slope.id.localeCompare(b.slope.id));
	const selected = candidates[0];
	if (!selected) return null;

	const normal = normalFor(selected.slope);
	const material = materialFor(selected.slope.materialId, input.materials);
	const gravity = input.gravity ?? 1;
	const slideMultiplier = material.slideMultiplier ?? 1;
	const slideForce = Number((gravity * Math.abs(normal.x) * slideMultiplier * (1 - Math.min(1, material.traction))).toFixed(6));
	return {
		slopeId: selected.slope.id,
		materialId: selected.slope.materialId,
		y: Number(selected.y.toFixed(6)),
		normalX: normal.x,
		normalY: normal.y,
		slideForce,
		tractionModifier: material.traction,
	};
}

export function walkSlopeSurface<T extends SlopeWalkerState>(input: SlopeWalkInput<T>): SlopeWalkOutput<T> {
	if (!Number.isFinite(input.dt) || input.dt < 0) throw new Error(`Invalid slope dt: ${input.dt}`);
	const centerX = input.body.x + input.body.w / 2;
	const sample = resolveSlopeSurface({ x: centerX, slopes: input.slopes, materials: input.materials, gravity: input.gravity });
	if (!sample) return { body: { ...input.body } as T, sample: null };

	const moveX = input.moveX ?? 0;
	const walkSpeed = input.walkSpeed ?? 0;
	const vx = input.body.vx + moveX * walkSpeed * sample.tractionModifier;
	const slideDirection = sample.normalX === 0 ? 0 : sample.normalX > 0 ? -1 : 1;
	const nextVx = vx + slideDirection * sample.slideForce * input.dt;
	const nextX = input.body.x + nextVx * input.dt;
	const nextCenterX = nextX + input.body.w / 2;
	const nextSample = resolveSlopeSurface({ x: nextCenterX, slopes: input.slopes, materials: input.materials, gravity: input.gravity }) ?? sample;
	return {
		body: { ...input.body, x: Number(nextX.toFixed(6)), y: Number((nextSample.y - input.body.h).toFixed(6)), vx: Number(nextVx.toFixed(6)), vy: 0, onGround: true } as T,
		sample: nextSample,
	};
}
