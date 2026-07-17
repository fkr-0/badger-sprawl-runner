import type { Rect } from '../types';
import { aabb } from './aabb';

export interface WallProbeBody extends Rect {
	id: string;
	vx: number;
	vy: number;
	dir: number;
	onGround: boolean;
}

export interface WallInteractionParams {
	probeDistance: number;
	wallSlideMaxSpeed: number;
	wallJumpVelocityX: number;
	wallJumpVelocityY: number;
}

export interface WallContact {
	wallId: string;
	side: 'left' | 'right';
}

export interface WallInteractionResult<T extends WallProbeBody> {
	body: T;
	contact: WallContact | null;
	wallSliding: boolean;
	wallJumped: boolean;
}

function probe(body: WallProbeBody, side: 'left' | 'right', distance: number): Rect {
	return {
		x: side === 'left' ? body.x - distance : body.x + body.w,
		y: body.y + 2,
		w: distance,
		h: Math.max(1, body.h - 4),
	};
}

export function detectWallContact(
	body: WallProbeBody,
	walls: ReadonlyArray<Rect & { id: string }>,
	probeDistance: number
): WallContact | null {
	if (!Number.isFinite(probeDistance) || probeDistance <= 0) throw new Error(`Invalid wall probe distance: ${probeDistance}`);
	const candidates: WallContact[] = [];
	for (const wall of [...walls].sort((a, b) => a.id.localeCompare(b.id))) {
		if (aabb(probe(body, 'left', probeDistance), wall)) candidates.push({ wallId: wall.id, side: 'left' });
		if (aabb(probe(body, 'right', probeDistance), wall)) candidates.push({ wallId: wall.id, side: 'right' });
	}
	return candidates.sort((a, b) => a.wallId.localeCompare(b.wallId) || a.side.localeCompare(b.side))[0] ?? null;
}

export function applyWallInteraction<T extends WallProbeBody>(
	body: T,
	walls: ReadonlyArray<Rect & { id: string }>,
	params: WallInteractionParams,
	input: { jumpPressed?: boolean } = {}
): WallInteractionResult<T> {
	const contact = detectWallContact(body, walls, params.probeDistance);
	const next = { ...body } as T;
	let wallSliding = false;
	let wallJumped = false;

	if (contact && !body.onGround && body.vy > 0) {
		wallSliding = true;
		next.vy = Math.min(body.vy, params.wallSlideMaxSpeed);
	}

	if (contact && !body.onGround && input.jumpPressed) {
		wallJumped = true;
		wallSliding = false;
		next.vx = contact.side === 'left' ? params.wallJumpVelocityX : -params.wallJumpVelocityX;
		next.vy = params.wallJumpVelocityY;
		next.dir = contact.side === 'left' ? 1 : -1;
	}

	return { body: next, contact, wallSliding, wallJumped };
}
