/**
 * Typed event bus for pub/sub communication between systems
 */

type EventMap = Record<string, unknown>;
type EventKey<T extends EventMap> = string & keyof T;
type EventHandler<T> = (payload: T) => void;

export class EventBus<T extends EventMap = Record<string, unknown>> {
	private listeners = new Map<EventKey<T>, Set<EventHandler<unknown>>>();

	on<K extends EventKey<T>>(key: K, handler: EventHandler<T[K]>): void {
		let handlers = this.listeners.get(key);
		if (!handlers) {
			handlers = new Set();
			this.listeners.set(key, handlers);
		}
		handlers.add(handler as EventHandler<unknown>);
	}

	off<K extends EventKey<T>>(key: K, handler: EventHandler<T[K]>): void {
		this.listeners.get(key)?.delete(handler as EventHandler<unknown>);
	}

	emit<K extends EventKey<T>>(key: K, payload: T[K]): void {
		const handlers = this.listeners.get(key);
		if (!handlers) return;
		for (const handler of handlers) {
			handler(payload);
		}
	}
}
