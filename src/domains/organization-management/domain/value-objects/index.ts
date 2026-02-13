/**
 * Organization & School Management Domain - Value Objects
 */

import { ValueObject } from '@/shared/domain';
import { Guard } from '@/shared/lib/utils';

// ============ Organization Value Objects ============

export interface OrganizationNameProps {
  value: string;
}

export class OrganizationName extends ValueObject<OrganizationNameProps> {
  constructor(value: string) {
    Guard.isEmptyString(value, 'Organization name');
    Guard.lengthIsBetween(value, 2, 100, 'Organization name');
    super({ value: value.trim() });
  }

  static create(value: string): OrganizationName {
    return new OrganizationName(value);
  }

  getValue(): string {
    return this.props.value;
  }
}

export interface AddressProps {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export class Address extends ValueObject<AddressProps> {
  constructor(props: AddressProps) {
    Guard.isEmptyString(props.street, 'Street');
    Guard.isEmptyString(props.city, 'City');
    Guard.isEmptyString(props.state, 'State');
    Guard.isEmptyString(props.zipCode, 'Zip Code');
    super(props);
  }

  static create(props: AddressProps): Address {
    return new Address(props);
  }

  getStreet(): string {
    return this.props.street;
  }

  getCity(): string {
    return this.props.city;
  }

  getState(): string {
    return this.props.state;
  }

  getZipCode(): string {
    return this.props.zipCode;
  }

  getCountry(): string {
    return this.props.country || 'INDIA';
  }

  getFullAddress(): string {
    return `${this.props.street}, ${this.props.city}, ${this.props.state} ${this.props.zipCode}`;
  }
}

export interface ContactInfoProps {
  email: string;
  phone: string;
}

export class ContactInfo extends ValueObject<ContactInfoProps> {
  constructor(props: ContactInfoProps) {
    Guard.isEmptyString(props.email, 'Contact email');
    Guard.isEmptyString(props.phone, 'Contact phone');
    super(props);
  }

  static create(props: ContactInfoProps): ContactInfo {
    return new ContactInfo(props);
  }

  getEmail(): string {
    return this.props.email;
  }

  getPhone(): string {
    return this.props.phone;
  }
}

// ============ School Value Objects ============

export interface SchoolCodeProps {
  value: string;
}

export class SchoolCode extends ValueObject<SchoolCodeProps> {
  constructor(value: string) {
    Guard.isEmptyString(value, 'School code');
    Guard.lengthIsBetween(value, 2, 20, 'School code');
    super({ value: value.toUpperCase() });
  }

  static create(value: string): SchoolCode {
    return new SchoolCode(value);
  }

  getValue(): string {
    return this.props.value;
  }
}

export interface SchoolNameProps {
  value: string;
}

export class SchoolName extends ValueObject<SchoolNameProps> {
  constructor(value: string) {
    Guard.isEmptyString(value, 'School name');
    Guard.lengthIsBetween(value, 2, 100, 'School name');
    super({ value: value.trim() });
  }

  static create(value: string): SchoolName {
    return new SchoolName(value);
  }

  getValue(): string {
    return this.props.value;
  }
}
