import type { PointerContactState, PointerDevice } from '@arcade/runtime/core';

export interface TouchInputSurface {
	getBoundingClientRect(): Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>;
}

export interface RunnerTouchAction {
	moveLeft: boolean;
	moveRight: boolean;
	jump: boolean;
	jumpPressed: boolean;
	fastFall: boolean;
	dodge: boolean;
	dodgePressed: boolean;
}

export interface RunnerTouchController {
	read(): RunnerTouchAction;
	reset(): void;
}

interface TouchTrack {
	startX: number;
	startY: number;
	lastX: number;
	lastY: number;
	sequence: number;
	gesture: 'jump' | 'dodge' | 'slide' | null;
}

const EMPTY_TOUCH_ACTION: RunnerTouchAction = Object.freeze({
	moveLeft: false,
	moveRight: false,
	jump: false,
	jumpPressed: false,
	fastFall: false,
	dodge: false,
	dodgePressed: false,
});

function isInside(
	contact: PointerContactState,
	rect: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>
): boolean {
	return (
		contact.x >= rect.left &&
		contact.x <= rect.left + rect.width &&
		contact.y >= rect.top &&
		contact.y <= rect.top + rect.height
	);
}

function latestTrack(tracks: ReadonlyMap<number, TouchTrack>): TouchTrack | null {
	let latest: TouchTrack | null = null;
	for (const track of tracks.values()) {
		if (!latest || track.sequence > latest.sequence) latest = track;
	}
	return latest;
}

export function createRunnerTouchController(options: {
	pointer: PointerDevice;
	surface: TouchInputSurface;
	swipeRatio?: number;
	dragRatio?: number;
	tapRatio?: number;
	pulseFrames?: number;
}): RunnerTouchController {
	const tracks = new Map<number, TouchTrack>();
	const swipeRatio = Math.max(0.03, options.swipeRatio ?? 0.075);
	const dragRatio = Math.max(0.015, options.dragRatio ?? 0.035);
	const tapRatio = Math.max(0.01, options.tapRatio ?? 0.035);
	const pulseFrames = Math.max(1, Math.floor(options.pulseFrames ?? 5));
	let jumpFrames = 0;
	let fastFallFrames = 0;
	let dodgeFrames = 0;
	let dodgeDirection: -1 | 0 | 1 = 0;
	let suppressUntilClear = false;

	const reset = (): void => {
		tracks.clear();
		jumpFrames = 0;
		fastFallFrames = 0;
		dodgeFrames = 0;
		dodgeDirection = 0;
		suppressUntilClear = true;
	};

	return {
		read(): RunnerTouchAction {
			const rect = options.surface.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return EMPTY_TOUCH_ACTION;
			const contacts = options.pointer
				.snapshot()
				.pointers.filter(
					(contact) =>
						contact.pointerType === 'touch' && contact.buttons !== 0 && isInside(contact, rect)
				);
			if (suppressUntilClear) {
				if (contacts.length === 0) suppressUntilClear = false;
				return EMPTY_TOUCH_ACTION;
			}

			const scale = Math.max(1, Math.min(rect.width, rect.height));
			const swipeThreshold = Math.max(28, scale * swipeRatio);
			const dragThreshold = Math.max(12, scale * dragRatio);
			const tapThreshold = Math.max(14, scale * tapRatio);
			const activeIds = new Set<number>();
			let jumpPressed = false;
			let dodgePressed = false;

			for (const contact of contacts) {
				activeIds.add(contact.pointerId);
				let track = tracks.get(contact.pointerId);
				if (!track) {
					track = {
						startX: contact.x,
						startY: contact.y,
						lastX: contact.x,
						lastY: contact.y,
						sequence: contact.sequence,
						gesture: null,
					};
					tracks.set(contact.pointerId, track);
				}
				track.lastX = contact.x;
				track.lastY = contact.y;
				track.sequence = contact.sequence;

				if (track.gesture) continue;
				const dx = track.lastX - track.startX;
				const dy = track.lastY - track.startY;
				if (Math.abs(dx) >= swipeThreshold && Math.abs(dx) > Math.abs(dy) * 1.1) {
					track.gesture = 'dodge';
					dodgeDirection = dx < 0 ? -1 : 1;
					dodgeFrames = pulseFrames;
					dodgePressed = true;
				} else if (dy <= -swipeThreshold) {
					track.gesture = 'jump';
					jumpFrames = pulseFrames;
					jumpPressed = true;
				} else if (dy >= swipeThreshold) {
					track.gesture = 'slide';
					fastFallFrames = pulseFrames;
					dodgeFrames = pulseFrames;
					dodgePressed = true;
				}
			}

			for (const [pointerId, track] of [...tracks]) {
				if (activeIds.has(pointerId)) continue;
				if (track.gesture === null) {
					const distance = Math.hypot(track.lastX - track.startX, track.lastY - track.startY);
					if (distance <= tapThreshold) {
						jumpFrames = pulseFrames;
						jumpPressed = true;
					}
				}
				tracks.delete(pointerId);
			}

			const active = latestTrack(tracks);
			let dragDirection: -1 | 0 | 1 = 0;
			if (active) {
				const dx = active.lastX - active.startX;
				if (Math.abs(dx) >= dragThreshold) dragDirection = dx < 0 ? -1 : 1;
			}

			const moveDirection = dodgeFrames > 0 && dodgeDirection !== 0 ? dodgeDirection : dragDirection;
			const result: RunnerTouchAction = {
				moveLeft: moveDirection < 0,
				moveRight: moveDirection > 0,
				jump: jumpFrames > 0,
				jumpPressed,
				fastFall: fastFallFrames > 0,
				dodge: dodgeFrames > 0,
				dodgePressed,
			};

			jumpFrames = Math.max(0, jumpFrames - 1);
			fastFallFrames = Math.max(0, fastFallFrames - 1);
			dodgeFrames = Math.max(0, dodgeFrames - 1);
			if (dodgeFrames === 0) dodgeDirection = 0;
			return result;
		},
		reset,
	};
}
