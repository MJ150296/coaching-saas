/**
 * User Management Domain - Value Objects
 */

import { ValueObject } from '@/shared/domain';
import { Guard, isEmail } from '@/shared/lib/utils';

export interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  constructor(value: string) {
    Guard.isEmptyString(value, 'Email');
    Guard.lengthIsBetween(value, 5, 255, 'Email');

    if (!isEmail(value)) {
      throw new Error('Invalid email format');
    }

    super({ value: value.toLowerCase() });
  }

  static create(value: string): Email {
    return new Email(value);
  }

  getValue(): string {
    return this.props.value;
  }
}

export interface PasswordProps {
  value: string;
  isHashed?: boolean;
}

export class Password extends ValueObject<PasswordProps> {
  constructor(value: string, isHashed: boolean = false) {
    Guard.isEmptyString(value, 'Password');

    if (!isHashed && value.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    super({
      value,
      isHashed,
    });
  }

  static create(value: string, isHashed: boolean = false): Password {
    return new Password(value, isHashed);
  }

  getValue(): string {
    return this.props.value;
  }

  isHashed(): boolean {
    return this.props.isHashed || false;
  }
}

export interface UserNameProps {
  firstName: string;
  lastName: string;
}

export class UserName extends ValueObject<UserNameProps> {
  constructor(firstName: string, lastName: string) {
    Guard.isEmptyString(firstName, 'First name');
    Guard.isEmptyString(lastName, 'Last name');
    Guard.lengthIsBetween(firstName, 2, 50, 'First name');
    Guard.lengthIsBetween(lastName, 2, 50, 'Last name');

    super({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  }

  static create(firstName: string, lastName: string): UserName {
    return new UserName(firstName, lastName);
  }

  getFirstName(): string {
    return this.props.firstName;
  }

  getLastName(): string {
    return this.props.lastName;
  }

  getFullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }
}

export interface UserPhoneProps {
  value: string;
}

export class UserPhone extends ValueObject<UserPhoneProps> {
  constructor(value: string) {
    Guard.isEmptyString(value, 'Phone');
    super({ value: value.trim() });
  }

  static create(value: string): UserPhone {
    return new UserPhone(value);
  }

  getValue(): string {
    return this.props.value;
  }
}
