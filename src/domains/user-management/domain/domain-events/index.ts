/**
 * User Management Domain - Events
 */

import { DomainEvent } from '@/shared/domain';

export class UserCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly email: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly role: string,
    occurredAt?: Date
  ) {
    super(aggregateId, occurredAt);
  }

  getEventName(): string {
    return 'UserCreatedEvent';
  }

  getAggregateId(): string {
    return this.aggregateId as string;
  }
}

export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly oldRole: string,
    readonly newRole: string,
    occurredAt?: Date
  ) {
    super(aggregateId, occurredAt);
  }

  getEventName(): string {
    return 'UserRoleChangedEvent';
  }

  getAggregateId(): string {
    return this.aggregateId as string;
  }
}

export class UserActivatedEvent extends DomainEvent {
  constructor(aggregateId: string, occurredAt?: Date) {
    super(aggregateId, occurredAt);
  }

  getEventName(): string {
    return 'UserActivatedEvent';
  }

  getAggregateId(): string {
    return this.aggregateId as string;
  }
}

export class UserDeactivatedEvent extends DomainEvent {
  constructor(aggregateId: string, occurredAt?: Date) {
    super(aggregateId, occurredAt);
  }

  getEventName(): string {
    return 'UserDeactivatedEvent';
  }

  getAggregateId(): string {
    return this.aggregateId as string;
  }
}
