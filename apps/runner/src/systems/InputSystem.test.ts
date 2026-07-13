import { describe, expect, it, vi } from 'vitest';
import { InputSystem, type KeyboardInputTarget } from './InputSystem';

class KeyboardTargetStub implements KeyboardInputTarget {
	private listeners = new Map<'keydown' | 'keyup', Set<(event: KeyboardEvent) => void>>();

	addEventListener(type: 'keydown' | 'keyup', listener: (event: KeyboardEvent) => void): void {
		const listeners = this.listeners.get(type) ?? new Set();
		listeners.add(listener);
		this.listeners.set(type, listeners);
	}

	removeEventListener(type: 'keydown' | 'keyup', listener: (event: KeyboardEvent) => void): void {
		this.listeners.get(type)?.delete(listener);
	}

	dispatch(type: 'keydown' | 'keyup', code: string): void {
		const event = { code, preventDefault: vi.fn() } as unknown as KeyboardEvent;
		for (const listener of this.listeners.get(type) ?? []) listener(event);
	}

	listenerCount(type: 'keydown' | 'keyup'): number {
		return this.listeners.get(type)?.size ?? 0;
	}
}

describe('InputSystem lifecycle', () => {
	it('detaches listeners and clears held input when destroyed', () => {
		const target = new KeyboardTargetStub();
		const input = new InputSystem(target);
		target.dispatch('keydown', 'KeyJ');

		expect(input.snapshot()).toMatchObject({ melee: true, meleePressed: true });
		expect(target.listenerCount('keydown')).toBe(1);
		expect(target.listenerCount('keyup')).toBe(1);

		input.destroy();
		input.destroy();
		target.dispatch('keydown', 'KeyK');

		expect(input.snapshot()).toMatchObject({ melee: false, shoot: false, shootPressed: false });
		expect(target.listenerCount('keydown')).toBe(0);
		expect(target.listenerCount('keyup')).toBe(0);
	});
});
