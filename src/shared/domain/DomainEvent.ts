/**
 * Base DomainEvent class
 * Domain events represent something significant that happened in the domain
 */

export abstract class DomainEvent {
  readonly occurredAt: Date;
  readonly aggregateId: string | number;

  constructor(aggregateId: string | number, occurredAt?: Date) {
    this.aggregateId = aggregateId;
    this.occurredAt = occurredAt || new Date();
  }

  abstract getEventName(): string;
  abstract getAggregateId(): string | number;
}
