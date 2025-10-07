// core/ChatCore.ts
type EventHandler = (...args: any[]) => void;

export class ChatCore {
  private static events: Map<string, EventHandler[]> = new Map();

  static on(event: string, handler: EventHandler) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event)!.push(handler);
  }

  static off(event: string, handler: EventHandler) {
    const handlers = this.events.get(event);
    if (!handlers) return;
    this.events.set(
      event,
      handlers.filter((h) => h !== handler)
    );
  }

  static emit(event: string, ...args: any[]) {
    const handlers = this.events.get(event);
    if (!handlers) return;
    for (const handler of handlers) handler(...args);
  }
}
