/**
 * Specification Pattern
 * Used for reusable, testable business rules
 */

export abstract class Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  abstract toQuery(): Record<string, unknown>;

  and(other: Specification<T>): Specification<T> {
    return new CompositeSpecification<T>(this, other, 'and');
  }

  or(other: Specification<T>): Specification<T> {
    return new CompositeSpecification<T>(this, other, 'or');
  }

  not(): Specification<T> {
    return new NotSpecification<T>(this);
  }
}

class CompositeSpecification<T> extends Specification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>,
    private operator: 'and' | 'or'
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    if (this.operator === 'and') {
      return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
    }
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }

  toQuery(): Record<string, unknown> {
    return {
      [this.operator]: [this.left.toQuery(), this.right.toQuery()],
    };
  }
}

class NotSpecification<T> extends Specification<T> {
  constructor(private specification: Specification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.specification.isSatisfiedBy(candidate);
  }

  toQuery(): Record<string, unknown> {
    return { not: this.specification.toQuery() };
  }
}
