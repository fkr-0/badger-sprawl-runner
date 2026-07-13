/**
 * Input system: maps keyboard/gamepad to ActionMap with edge detection
 */

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

export class InputSystem {
	private keys = new Set<string>();
	private pressed = new Set<string>();
	private readonly keyDownListener = (event: KeyboardEvent): void => this.onKeyDown(event);
	private readonly keyUpListener = (event: KeyboardEvent): void => this.onKeyUp(event);
	private destroyed = false;

	constructor(private readonly target: KeyboardInputTarget = window) {
		this.target.addEventListener('keydown', this.keyDownListener);
		this.target.addEventListener('keyup', this.keyUpListener);
	}

	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		this.target.removeEventListener('keydown', this.keyDownListener);
		this.target.removeEventListener('keyup', this.keyUpListener);
		this.keys.clear();
		this.pressed.clear();
	}

	private onKeyDown(e: KeyboardEvent): void {
		if (!this.keys.has(e.code)) {
			this.pressed.add(e.code);
		}
		this.keys.add(e.code);
		if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
			e.preventDefault();
		}
	}

	private onKeyUp(e: KeyboardEvent): void {
		this.keys.delete(e.code);
	}

	snapshot(): ActionMap {
		const left = this.has('KeyA', 'ArrowLeft');
		const right = this.has('KeyD', 'ArrowRight');

		return {
			moveLeft: left,
			moveRight: right,
			jump: this.has('Space', 'KeyW', 'ArrowUp'),
			jumpPressed: this.edge('Space', 'KeyW', 'ArrowUp'),
			fastFall: this.has('KeyS', 'ArrowDown'),
			melee: this.has('KeyJ'),
			meleePressed: this.edge('KeyJ'),
			shoot: this.has('KeyK'),
			shootPressed: this.edge('KeyK'),
			item: this.has('KeyE'),
			itemPressed: this.edge('KeyE'),
			parry: this.has('KeyL'),
			parryPressed: this.edge('KeyL'),
			dodge: this.has('ShiftLeft', 'ShiftRight', 'KeyR'),
			dodgePressed: this.edge('ShiftLeft', 'ShiftRight', 'KeyR'),
			hack: this.has('KeyM'),
			hackPressed: this.edge('KeyM'),
			hackHeld: this.keys.has('KeyM'),
			pause: this.has('Escape'),
			pausePressed: this.edge('Escape'),
			debugToggle: this.edge('KeyH'),
		};
	}

	clearPressed(): void {
		this.pressed.clear();
	}

	private has(...codes: string[]): boolean {
		return codes.some((c) => this.keys.has(c));
	}

	private edge(...codes: string[]): boolean {
		return codes.some((c) => this.pressed.has(c));
	}
}
