/**
 * Base Entity class
 * All domain entities should extend from this class
 * Entities have identity and equality is based on their ID
 */

export abstract class Entity<T> {
  protected readonly id: T;
  protected createdAt: Date;
  protected updatedAt: Date;

  constructor(id: T, createdAt?: Date, updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  getId(): T {
    return this.id;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  setUpdatedAt(date: Date): void {
    this.updatedAt = date;
  }

  /**
   * Entities are equal if they have the same ID
   */
  equals(other: Entity<T>): boolean {
    if (!(other instanceof Entity)) {
      return false;
    }
    return JSON.stringify(this.id) === JSON.stringify(other.id);
  }
}
