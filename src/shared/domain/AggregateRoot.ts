import { Entity } from './Entity';
import { DomainEvent } from './DomainEvent';

/**
 * Base Aggregate Root class
 * Aggregates are clusters of domain objects (entities and value objects)
 * bound together by a root entity (Aggregate Root)
 * Only aggregate roots can be accessed from outside the aggregate
 */

export abstract class AggregateRoot<T> extends Entity<T> {
  private domainEvents: DomainEvent[] = [];

  /**
   * Add a domain event to be published
   */
  addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * Get all domain events
   */
  getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  /**
   * Clear all domain events after publishing
   */
  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
