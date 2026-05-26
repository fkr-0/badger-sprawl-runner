import type { Rect } from '../types';
import { sweepAabb, type SweepHit, type SweptObstacle } from './sweptAabb';

export interface KinematicBody extends Rect {
	id: string;
	vx: number;
	vy: number;
	onGround: boolean;
}

export interface KinematicMoveInput<T extends KinematicBody> {
	body: T;
	obstacles: ReadonlyArray<SweptObstacle>;
	dt: number;
	maxSlides?: number;
}

export interface KinematicCollision {
	obstacleId: string;
	normalX: number;
	normalY: number;
	time: number;
	remainingTime: number;
}

export interface KinematicMoveResult<T extends KinematicBody> {
	body: T;
	collisions: KinematicCollision[];
}

function toCollision(hit: SweepHit): KinematicCollision {
	return {
		obstacleId: hit.obstacle.id,
		normalX: hit.normalX,
		normalY: hit.normalY,
		time: Number(hit.time.toFixed(6)),
		remainingTime: Number(hit.remainingTime.toFixed(6)),
	};
}

export function moveKinematicBody<T extends KinematicBody>(input: KinematicMoveInput<T>): KinematicMoveResult<T> {
	if (!Number.isFinite(input.dt) || input.dt < 0) throw new Error(`Invalid kinematic dt: ${input.dt}`);
	const maxSlides = input.maxSlides ?? 3;
	if (!Number.isInteger(maxSlides) || maxSlides <= 0) throw new Error(`Invalid maxSlides: ${maxSlides}`);

	let body = { ...input.body, onGround: false } as T;
	let remaining = input.dt;
	let vx = input.body.vx;
	let vy = input.body.vy;
	const collisions: KinematicCollision[] = [];

	for (let slide = 0; slide < maxSlides && remaining > 0; slide += 1) {
		const sweep = sweepAabb({ body, vx, vy, dt: remaining, obstacles: input.obstacles });
		body = { ...body, x: sweep.x, y: sweep.y, vx: sweep.vx, vy: sweep.vy };
		vx = sweep.vx;
		vy = sweep.vy;
		if (!sweep.hit) break;

		collisions.push(toCollision(sweep.hit));
		if (sweep.hit.normalY < 0) body.onGround = true;
		remaining = sweep.hit.remainingTime;
		if (sweep.hit.normalX !== 0) vx = 0;
		if (sweep.hit.normalY !== 0) vy = 0;
		if (vx === 0 && vy === 0) break;
	}

	return { body: { ...body, vx, vy } as T, collisions };
}
