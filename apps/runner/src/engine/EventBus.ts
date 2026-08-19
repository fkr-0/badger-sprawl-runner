/** Typed compatibility facade over the shared arcade-runtime event engine. */

import { createEventBus } from '@arcade/runtime/core';
import type { ArcadeEventBus } from '@arcade/runtime/core';

type EventMap = Record<string, unknown>;
type EventKey<T extends EventMap> = string & keyof T;
type EventHandler<T> = (payload: T) => void;

export class EventBus<T extends EventMap = Record<string, unknown>> {
	private readonly core: ArcadeEventBus<T> = createEventBus<T>();

	on<K extends EventKey<T>>(key: K, handler: EventHandler<T[K]>): () => void {
		return this.core.on(key, handler);
	}

	once<K extends EventKey<T>>(key: K, handler: EventHandler<T[K]>): () => void {
		return this.core.once(key, handler);
	}

	off<K extends EventKey<T>>(key: K, handler?: EventHandler<T[K]>): boolean {
		return this.core.off(key, handler);
	}

	emit<K extends EventKey<T>>(key: K, payload: T[K]): number {
		return this.core.emit(key, payload);
	}

	clear<K extends EventKey<T>>(key?: K): boolean {
		return this.core.clear(key);
	}

	hasListeners<K extends EventKey<T>>(key: K): boolean {
		return this.core.hasListeners(key);
	}

	listenerCount<K extends EventKey<T>>(key?: K): number {
		return this.core.listenerCount(key);
	}

	snapshot() {
		return this.core.snapshot();
	}
}
