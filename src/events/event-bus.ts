import { EventEmitter } from "node:events";
import { logger } from "../utils/logger";
import { type DomainEvent, type DomainEventName } from "./domain/domain-events";

type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T
) => void | Promise<void>;

export class EventBus {
  private readonly emitter = new EventEmitter();

  publish(event: DomainEvent): void {
    this.emitter.emit(event.name, event);
  }

  subscribe<T extends DomainEvent = DomainEvent>(
    eventName: DomainEventName,
    handler: EventHandler<T>
  ): void {
    this.emitter.on(eventName, (event: DomainEvent) => {
      void Promise.resolve(handler(event as T)).catch((error) => {
        logger.error(
          { error, eventName, eventId: event.id },
          "Domain event handler failed"
        );
      });
    });
  }
}

export const eventBus = new EventBus();
