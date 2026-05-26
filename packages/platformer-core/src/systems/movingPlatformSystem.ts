import type { Rect } from '../types';
import { aabb } from './aabb';

export interface MovingPlatformPathPoint {
	x: number;
	y: number;
	time: number;
}

export interface MovingPlatformState extends Rect {
	id: string;
	path: MovingPlatformPathPoint[];
	loop: boolean;
	time: number;
	vx: number;
	vy: number;
}

export interface CarriedBody extends Rect {
	id: string;
	vx: number;
	vy: number;
	onGround: boolean;
	standingOnId?: string;
}

export interface MovingPlatformStepResult<T extends CarriedBody> {
	platforms: MovingPlatformState[];
	bodies: T[];
	carryEvents: Array<{ bodyId: string; platformId: string; dx: number; dy: number }>;
}

function assertPath(platform: MovingPlatformState): void {
	if (platform.path.length < 2) throw new Error(`Moving platform ${platform.id} needs at least two path points`);
	for (let index = 1; index < platform.path.length; index += 1) {
		if ((platform.path[index]?.time ?? 0) <= (platform.path[index - 1]?.time ?? 0)) {
			throw new Error(`Moving platform ${platform.id} path times must be strictly increasing`);
		}
	}
}

function samplePath(platform: MovingPlatformState, time: number): { x: number; y: number } {
	assertPath(platform);
	const duration = platform.path[platform.path.length - 1]!.time;
	let t = platform.loop ? time % duration : Math.min(time, duration);
	if (t < 0) t += duration;

	for (let index = 1; index < platform.path.length; index += 1) {
		const prev = platform.path[index - 1]!;
		const next = platform.path[index]!;
		if (t <= next.time) {
			const alpha = (t - prev.time) / (next.time - prev.time);
			return {
				x: prev.x + (next.x - prev.x) * alpha,
				y: prev.y + (next.y - prev.y) * alpha,
			};
		}
	}
	const last = platform.path[platform.path.length - 1]!;
	return { x: last.x, y: last.y };
}

function isStandingOn(body: CarriedBody, platform: MovingPlatformState): boolean {
	const feet = { x: body.x, y: body.y + body.h, w: body.w, h: 2 };
	const top = { x: platform.x, y: platform.y - 1, w: platform.w, h: 4 };
	return body.onGround && aabb(feet, top);
}

export function stepMovingPlatforms<T extends CarriedBody>(
	platforms: readonly MovingPlatformState[],
	bodies: readonly T[],
	dt: number
): MovingPlatformStepResult<T> {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid moving platform dt: ${dt}`);
	const carryEvents: MovingPlatformStepResult<T>['carryEvents'] = [];
	const previousById = new Map(platforms.map((platform) => [platform.id, platform]));
	const nextPlatforms = [...platforms]
		.sort((a, b) => a.id.localeCompare(b.id))
		.map((platform) => {
			const previous = samplePath(platform, platform.time);
			const next = samplePath(platform, platform.time + dt);
			return {
				...platform,
				x: next.x,
				y: next.y,
				vx: dt === 0 ? 0 : (next.x - previous.x) / dt,
				vy: dt === 0 ? 0 : (next.y - previous.y) / dt,
				time: platform.time + dt,
			};
		});

	const nextById = new Map(nextPlatforms.map((platform) => [platform.id, platform]));
	const nextBodies = [...bodies]
		.sort((a, b) => a.id.localeCompare(b.id))
		.map((body) => {
			const standingPlatform = nextPlatforms.find((platform) => body.standingOnId === platform.id || isStandingOn(body, previousById.get(platform.id) ?? platform));
			if (!standingPlatform) return { ...body, standingOnId: undefined } as T;
			const previous = previousById.get(standingPlatform.id)!;
			const next = nextById.get(standingPlatform.id)!;
			const dx = next.x - previous.x;
			const dy = next.y - previous.y;
			carryEvents.push({ bodyId: body.id, platformId: standingPlatform.id, dx: Number(dx.toFixed(6)), dy: Number(dy.toFixed(6)) });
			return {
				...body,
				x: body.x + dx,
				y: body.y + dy,
				standingOnId: standingPlatform.id,
			} as T;
		});

	return { platforms: nextPlatforms, bodies: nextBodies, carryEvents };
}
