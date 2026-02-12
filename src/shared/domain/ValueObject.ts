/**
 * Base ValueObject class
 * Value objects have no identity, equality is based on their properties
 * They are immutable
 */

export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = { ...props };
    Object.freeze(this);
  }

  getProps(): T {
    return this.props;
  }

  /**
   * Value objects are equal if all their properties are equal
   */
  equals(other: ValueObject<T>): boolean {
    if (!(other instanceof ValueObject)) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(other.getProps());
  }
}
