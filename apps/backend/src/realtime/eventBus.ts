import type { SSEEvent, SSEEventType } from "@stock-alert/shared-types";

type EventHandler = (event: SSEEvent) => void;

export class EventBus {
  private readonly handlers = new Map<SSEEventType, Set<EventHandler>>();
  private readonly wildcardHandlers = new Set<EventHandler>();

  on(type: SSEEventType, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  onAny(handler: EventHandler): void {
    this.wildcardHandlers.add(handler);
  }

  off(type: SSEEventType, handler: EventHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  offAny(handler: EventHandler): void {
    this.wildcardHandlers.delete(handler);
  }

  emit<T>(type: SSEEventType, data: T): void {
    const event: SSEEvent<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    for (const handler of this.handlers.get(type) ?? []) {
      handler(event);
    }
    for (const handler of this.wildcardHandlers) {
      handler(event);
    }
  }
}

export const eventBus = new EventBus();
