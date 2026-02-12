/**
 * Utility functions
 */

export function isEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length === 0;
}

export function isEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Guard {
  static againstNullOrUndefined(value: any, argName: string): void {
    if (value === null || value === undefined) {
      throw new Error(`${argName} must not be null or undefined`);
    }
  }

  static againstNullOrUndefinedBulk(args: { name: string; value: any }[]): void {
    for (const { name, value } of args) {
      this.againstNullOrUndefined(value, name);
    }
  }

  static isOneOf(
    value: any,
    validValues: any[],
    argName: string
  ): void {
    if (!validValues.includes(value)) {
      throw new Error(`${argName} must be one of ${validValues.join(', ')}`);
    }
  }

  static isEmptyString(value: string, argName: string): void {
    if (isEmptyString(value)) {
      throw new Error(`${argName} must not be empty`);
    }
  }

  static lengthIsBetween(
    value: string,
    min: number,
    max: number,
    argName: string
  ): void {
    const length = value.length;
    if (length < min || length > max) {
      throw new Error(
        `${argName} length must be between ${min} and ${max}. Received: ${length}`
      );
    }
  }
}
