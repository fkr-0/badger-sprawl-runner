import { describe, expect, it } from 'vitest';
import { EventBus } from './EventBus';

interface Events {
	hit: { damage: number };
}

describe('EventBus arcade-runtime facade', () => {
	it('supports once, unsubscribe and shared telemetry', () => {
		const bus = new EventBus<Events>();
		const damage: number[] = [];
		const unsubscribe = bus.on('hit', (event) => damage.push(event.damage));
		bus.once('hit', (event) => damage.push(event.damage * 10));

		expect(bus.emit('hit', { damage: 2 })).toBe(2);
		unsubscribe();
		expect(bus.emit('hit', { damage: 3 })).toBe(0);
		expect(damage).toEqual([2, 20]);
		expect(bus.snapshot()).toMatchObject({ emittedEvents: 2, listenerCount: 0 });
	});
});
