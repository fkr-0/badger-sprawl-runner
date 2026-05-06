/**
 * Typed event bus for pub/sub communication between systems
 */

type EventMap = Record<string, unknown>;
type EventKey<T extends EventMap> = string & keyof T;
type EventHandler<T> = (payload: T) => void;

export class EventBus<T extends EventMap = Record<string, unknown>> {
  private listeners = new Map<EventKey<T>, Set<EventHandler<unknown>>>();

  on<K extends EventKey<T>>(key: K, handler: EventHandler<T[K]>): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(handler as EventHandler<unknown>);
  }

  off<K extends EventKey<T>>(key: K, handler: EventHandler<T[K]>): void {
    this.listeners.get(key)?.delete(handler as EventHandler<unknown>);
  }

  emit<K extends EventKey<T>>(key: K, payload: T[K]): void {
    this.listeners.get(key)?.forEach(handler => handler(payload));
  }
}
