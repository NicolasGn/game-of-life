export type EventSubscriber<TEvent> = (event: TEvent) => void;

export class EventEmitter<TEvent = void> {
  private subscribers: EventSubscriber<TEvent>[];

  constructor() {
    this.subscribers = [];
  }

  public subscribe(subscriber: EventSubscriber<TEvent>): void {
    this.subscribers.push(subscriber);
  }

  public unsubscribe(subscriber: EventSubscriber<TEvent>): void {
    this.subscribers = this.subscribers.filter((s) => s !== subscriber);
  }

  public emit(event: TEvent): void {
    this.subscribers.forEach((subscriber) => subscriber(event));
  }
}
