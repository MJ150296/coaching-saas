/**
 * Organization Entity (Aggregate Root)
 */

import { AggregateRoot } from '@/shared/domain';
import { OrganizationName, Address, ContactInfo } from '../value-objects';

export interface OrganizationProps {
  organizationName: OrganizationName;
  type: string; // e.g., 'District', 'Board', 'Private'
  address: Address;
  contactInfo: ContactInfo;
  status: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

export class Organization extends AggregateRoot<string> {
  private organizationName: OrganizationName;
  private type: string;
  private address: Address;
  private contactInfo: ContactInfo;
  private status: 'active' | 'inactive';
  private metadata?: Record<string, any>;

  constructor(
    id: string,
    props: OrganizationProps,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.organizationName = props.organizationName;
    this.type = props.type;
    this.address = props.address;
    this.contactInfo = props.contactInfo;
    this.status = props.status;
    this.metadata = props.metadata;
  }

  static create(
    id: string,
    organizationName: OrganizationName,
    type: string,
    address: Address,
    contactInfo: ContactInfo
  ): Organization {
    return new Organization(id, {
      organizationName,
      type,
      address,
      contactInfo,
      status: 'active',
    });
  }

  getOrganizationName(): OrganizationName {
    return this.organizationName;
  }

  getType(): string {
    return this.type;
  }

  getAddress(): Address {
    return this.address;
  }

  getContactInfo(): ContactInfo {
    return this.contactInfo;
  }

  getStatus(): 'active' | 'inactive' {
    return this.status;
  }

  activate(): void {
    this.status = 'active';
    this.setUpdatedAt(new Date());
  }

  deactivate(): void {
    this.status = 'inactive';
    this.setUpdatedAt(new Date());
  }

  getMetadata(): Record<string, any> | undefined {
    return this.metadata;
  }

  setMetadata(metadata: Record<string, any>): void {
    this.metadata = metadata;
    this.setUpdatedAt(new Date());
  }
}
