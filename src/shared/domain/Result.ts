/**
 * Result Pattern
 * Used for handling errors and success values in a functional way
 */

export class Result<T, E = string> {
  private constructor(
    private readonly isSuccess: boolean,
    private readonly value?: T,
    private readonly error?: E
  ) {}

  static ok<T, E = string>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  static fail<T, E = string>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  getIsSuccess(): boolean {
    return this.isSuccess;
  }

  getIsFailure(): boolean {
    return !this.isSuccess;
  }

  getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value of a failed result');
    }
    return this.value!;
  }

  getError(): E {
    if (this.isSuccess) {
      throw new Error('Cannot get error of a successful result');
    }
    return this.error!;
  }

  fold<R>(onFailure: (error: E) => R, onSuccess: (value: T) => R): R {
    return this.isSuccess ? onSuccess(this.value!) : onFailure(this.error!);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isSuccess) {
      return Result.ok<U, E>(fn(this.value!));
    }
    return Result.fail<U, E>(this.error!);
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isSuccess) {
      return fn(this.value!);
    }
    return Result.fail<U, E>(this.error!);
  }
}
