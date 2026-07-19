/** Shared arcade-runtime semantic keyboard/gamepad input adapter. */

import {
	type ActionBinding,
	type ActionState,
	createActionInput,
} from '../../../../vendor/arcade-runtime.mjs';

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
	private destroyed = false;

	constructor(target: KeyboardInputTarget = window) {
		this.input = createActionInput({
			actions: ACTIONS,
			bindings: BINDINGS,
			keyboardOptions: {
				target: target as unknown as Window,
				preventDefaultCodes: ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
			},
			gamepadIndex: 0,
		});
	}

	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		this.input.destroy();
		this.input.reset();
	}

	snapshot(): ActionMap {
		const state = this.input.advance();
		return {
			moveLeft: held(state, 'moveLeft'),
			moveRight: held(state, 'moveRight'),
			jump: held(state, 'jump'),
			jumpPressed: pressed(state, 'jump'),
			fastFall: held(state, 'fastFall'),
			melee: held(state, 'melee'),
			meleePressed: pressed(state, 'melee'),
			shoot: held(state, 'shoot'),
			shootPressed: pressed(state, 'shoot'),
			item: held(state, 'item'),
			itemPressed: pressed(state, 'item'),
			parry: held(state, 'parry'),
			parryPressed: pressed(state, 'parry'),
			dodge: held(state, 'dodge'),
			dodgePressed: pressed(state, 'dodge'),
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
