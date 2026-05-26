import type { Rect } from '../types';
import { aabb } from './aabb';

export interface SurfaceMaterial {
	id: string;
	friction: number;
	traction: number;
	restitution: number;
	conveyorX?: number;
	conveyorY?: number;
	damagePerSecond?: number;
	tags?: string[];
}

export interface MaterialZone extends Rect {
	material: SurfaceMaterial;
	priority?: number;
}

export interface MaterialBody extends Rect {
	vx: number;
	vy: number;
	onGround: boolean;
}

export interface MaterialContact {
	material: SurfaceMaterial;
	zone: MaterialZone;
	overlapArea: number;
}

export interface MaterialStepResult<T extends MaterialBody> {
	body: T;
	contact: MaterialContact | null;
	damage: number;
}

export const DEFAULT_SURFACE_MATERIAL: SurfaceMaterial = {
	id: 'concrete',
	friction: 1,
	traction: 1,
	restitution: 0,
	conveyorX: 0,
	conveyorY: 0,
	damagePerSecond: 0,
	tags: ['solid'],
};

function overlapArea(a: Rect, b: Rect): number {
	const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
	const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
	return x * y;
}

export function sampleMaterialContact(body: Rect, zones: ReadonlyArray<MaterialZone>): MaterialContact | null {
	let best: MaterialContact | null = null;
	for (const zone of zones) {
		if (!aabb(body, zone)) continue;
		const area = overlapArea(body, zone);
		if (area <= 0) continue;
		const priority = zone.priority ?? 0;
		const bestPriority = best?.zone.priority ?? 0;
		if (!best || priority > bestPriority || (priority === bestPriority && area > best.overlapArea)) {
			best = { material: zone.material, zone, overlapArea: area };
		}
	}
	return best;
}

export function applySurfaceMaterial<T extends MaterialBody>(
	body: T,
	zones: ReadonlyArray<MaterialZone>,
	dt: number,
	fallback: SurfaceMaterial = DEFAULT_SURFACE_MATERIAL
): MaterialStepResult<T> {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid material dt: ${dt}`);
	const contact = sampleMaterialContact(body, zones);
	const material = contact?.material ?? fallback;
	let vx = body.vx;
	let vy = body.vy;

	if (body.onGround) {
		const frictionFactor = Math.max(0, 1 - Math.max(0, material.friction) * dt);
		vx *= frictionFactor;
		vx += (material.conveyorX ?? 0) * dt;
		vy += (material.conveyorY ?? 0) * dt;
	}

	if (material.restitution > 0 && body.vy > 0 && contact) {
		vy = -Math.abs(body.vy) * Math.min(1, material.restitution);
	}

	const damage = Math.max(0, material.damagePerSecond ?? 0) * dt;
	return {
		body: { ...body, vx, vy },
		contact,
		damage,
	};
}

export function materialHasTag(material: SurfaceMaterial, tag: string): boolean {
	return Boolean(material.tags?.includes(tag));
}
