import type { PointerContactState, PointerDevice } from '@arcade/runtime/core';
import { describe, expect, it } from 'vitest';
import { createRunnerTouchController } from './RunnerTouchInput';

function contact(
	pointerId: number,
	x: number,
	y: number,
	sequence: number,
): PointerContactState {
	return {
		pointerId,
		pointerType: 'touch',
		x,
		y,
		pressure: 1,
		buttons: 1,
		isPrimary: pointerId === 1,
		sequence,
	};
}

function harness() {
	let pointers: readonly PointerContactState[] = [];
	const pointer = { snapshot: () => ({ pointers }) } as PointerDevice;
	const surface = {
		getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
	};
	const controller = createRunnerTouchController({ pointer, surface, pulseFrames: 3 });
	return {
		controller,
		setPointers(next: readonly PointerContactState[]) {
			pointers = next;
		},
	};
}

describe('runner mobile gesture input', () => {
	it('turns a tap into a buffered jump pulse', () => {
		const h = harness();
		h.setPointers([contact(1, 220, 280, 1)]);
		expect(h.controller.read()).toMatchObject({ jump: false, jumpPressed: false });
		h.setPointers([]);
		expect(h.controller.read()).toMatchObject({ jump: true, jumpPressed: true });
		expect(h.controller.read()).toMatchObject({ jump: true, jumpPressed: false });
	});

	it('maps upward swipes to jump without waiting for release', () => {
		const h = harness();
		h.setPointers([contact(1, 300, 360, 1)]);
		h.controller.read();
		h.setPointers([contact(1, 302, 275, 2)]);
		expect(h.controller.read()).toMatchObject({ jump: true, jumpPressed: true });
	});

	it('maps horizontal swipes to directional dodge and skid input', () => {
		const h = harness();
		h.setPointers([contact(1, 320, 300, 1)]);
		h.controller.read();
		h.setPointers([contact(1, 410, 304, 2)]);
		expect(h.controller.read()).toMatchObject({
			moveRight: true,
			moveLeft: false,
			dodge: true,
			dodgePressed: true,
		});
	});

	it('maps downward swipes to fast-fall plus grounded skid/dodge semantics', () => {
		const h = harness();
		h.setPointers([contact(1, 420, 180, 1)]);
		h.controller.read();
		h.setPointers([contact(1, 422, 275, 2)]);
		expect(h.controller.read()).toMatchObject({
			fastFall: true,
			dodge: true,
			dodgePressed: true,
		});
	});

	it('uses horizontal drag as continuous movement before swipe activation', () => {
		const h = harness();
		h.setPointers([contact(1, 480, 300, 1)]);
		h.controller.read();
		h.setPointers([contact(1, 455, 300, 2)]);
		expect(h.controller.read()).toMatchObject({ moveLeft: true, moveRight: false, dodge: false });
	});

	it('suppresses stale held contacts after reset until all touches clear', () => {
		const h = harness();
		h.setPointers([contact(1, 240, 300, 1)]);
		h.controller.read();
		h.controller.reset();
		expect(h.controller.read()).toMatchObject({
			moveLeft: false,
			moveRight: false,
			jump: false,
			dodge: false,
		});
		h.setPointers([]);
		h.controller.read();
		h.setPointers([contact(2, 260, 300, 2)]);
		expect(h.controller.read()).toMatchObject({ jump: false, dodge: false });
	});
});
