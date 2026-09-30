/** Shared arcade-runtime semantic keyboard/gamepad input adapter. */

import { createActionInput, createPointerDevice } from '@arcade/runtime/core';
import type { ActionBinding, ActionState, PointerDevice } from '@arcade/runtime/core';
import { createRunnerTouchController, type RunnerTouchController, type TouchInputSurface } from './RunnerTouchInput';

export interface ActionMap {
	moveLeft: boolean;
	moveRight: boolean;
	jump: boolean;
	jumpPressed: boolean;
	fastFall: boolean;
	melee: boolean;
	meleePressed: boolean;
	shoot: boolean;
	shootPressed: boolean;
	item: boolean;
	itemPressed: boolean;
	parry: boolean;
	parryPressed: boolean;
	dodge: boolean;
	dodgePressed: boolean;
	hack: boolean;
	hackPressed: boolean;
	hackHeld: boolean;
	pause: boolean;
	pausePressed: boolean;
	debugToggle: boolean;
}

export interface KeyboardInputTarget {
	addEventListener(type: 'keydown' | 'keyup', listener: (event: KeyboardEvent) => void): void;
	removeEventListener(type: 'keydown' | 'keyup', listener: (event: KeyboardEvent) => void): void;
}

type RunnerAction =
	| 'moveLeft'
	| 'moveRight'
	| 'jump'
	| 'fastFall'
	| 'melee'
	| 'shoot'
	| 'item'
	| 'parry'
	| 'dodge'
	| 'hack'
	| 'pause'
	| 'debugToggle';

const ACTIONS: readonly RunnerAction[] = [
	'moveLeft',
	'moveRight',
	'jump',
	'fastFall',
	'melee',
	'shoot',
	'item',
	'parry',
	'dodge',
	'hack',
	'pause',
	'debugToggle',
];

const BINDINGS: Record<RunnerAction, ActionBinding[]> = {
	moveLeft: [
		'KeyA',
		'ArrowLeft',
		{ type: 'axis', index: 0, direction: -1 },
		{ type: 'button', index: 14 },
	],
	moveRight: [
		'KeyD',
		'ArrowRight',
		{ type: 'axis', index: 0, direction: 1 },
		{ type: 'button', index: 15 },
	],
	jump: ['Space', 'KeyW', 'ArrowUp', { type: 'button', index: 0 }],
	fastFall: [
		'KeyS',
		'ArrowDown',
		{ type: 'axis', index: 1, direction: 1 },
		{ type: 'button', index: 13 },
	],
	melee: ['KeyJ', { type: 'button', index: 2 }],
	shoot: ['KeyK', { type: 'button', index: 5 }],
	item: ['KeyE', { type: 'button', index: 3 }],
	parry: ['KeyL', { type: 'button', index: 4 }],
	dodge: ['ShiftLeft', 'ShiftRight', 'KeyR', { type: 'button', index: 1 }],
	hack: ['KeyM', { type: 'button', index: 6 }],
	pause: ['Escape', { type: 'button', index: 9 }],
	debugToggle: ['KeyH'],
};

function held(
	snapshot: Readonly<Record<RunnerAction, ActionState>>,
	action: RunnerAction
): boolean {
	return snapshot[action].held;
}

function pressed(
	snapshot: Readonly<Record<RunnerAction, ActionState>>,
	action: RunnerAction
): boolean {
	return snapshot[action].pressed;
}

export class InputSystem {
	private readonly input;
	private readonly pointer: PointerDevice | null;
	private readonly touch: RunnerTouchController | null;
	private destroyed = false;

	constructor(
		target: KeyboardInputTarget = window,
		touchOptions?: { surface: TouchInputSurface; pointer?: PointerDevice }
	) {
		this.pointer = touchOptions
			? (touchOptions.pointer ?? createPointerDevice({ target: window, preventDefault: true }))
			: null;
		this.touch = this.pointer && touchOptions
			? createRunnerTouchController({ pointer: this.pointer, surface: touchOptions.surface })
			: null;
		this.input = createActionInput({
			actions: ACTIONS,
			bindings: BINDINGS,
			keyboardOptions: {
				target: target as unknown as Window,
				preventDefaultCodes: ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
			},
			gamepadIndex: 0,
			...(this.pointer ? { pointer: this.pointer } : {}),
		});
	}

	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		this.touch?.reset();
		this.input.destroy();
		this.pointer?.destroy();
		this.input.reset();
	}

	snapshot(): ActionMap {
		const state = this.input.advance();
		const touch = this.touch?.read();
		return {
			moveLeft: held(state, 'moveLeft') || (touch?.moveLeft ?? false),
			moveRight: held(state, 'moveRight') || (touch?.moveRight ?? false),
			jump: held(state, 'jump') || (touch?.jump ?? false),
			jumpPressed: pressed(state, 'jump') || (touch?.jumpPressed ?? false),
			fastFall: held(state, 'fastFall') || (touch?.fastFall ?? false),
			melee: held(state, 'melee'),
			meleePressed: pressed(state, 'melee'),
			shoot: held(state, 'shoot'),
			shootPressed: pressed(state, 'shoot'),
			item: held(state, 'item'),
			itemPressed: pressed(state, 'item'),
			parry: held(state, 'parry'),
			parryPressed: pressed(state, 'parry'),
			dodge: held(state, 'dodge') || (touch?.dodge ?? false),
			dodgePressed: pressed(state, 'dodge') || (touch?.dodgePressed ?? false),
			hack: held(state, 'hack'),
			hackPressed: pressed(state, 'hack'),
			hackHeld: held(state, 'hack'),
			pause: held(state, 'pause'),
			pausePressed: pressed(state, 'pause'),
			debugToggle: pressed(state, 'debugToggle'),
		};
	}

	clearPressed(): void {
		this.input.clearEdges();
	}
}
