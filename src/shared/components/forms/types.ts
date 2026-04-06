import { UserRole } from '@/domains/user-management/domain/entities/User';

// Common option types used across forms
export type SelectOption = {
  value: string;
  label: string;
};

export type OrganizationOption = {
  id: string;
  name: string;
};

export type CoachingCenterOption = {
  id: string;
  name: string;
  organizationId: string;
};

export type AcademicYearOption = {
  id: string;
  name: string;
};

export type ProgramOption = {
  id: string;
  name: string;
  level?: string;
  organizationId: string;
  coachingCenterId: string;
};

export type TeacherOption = {
  id: string;
  name: string;
  email: string;
  organizationId?: string;
  coachingCenterId?: string;
};

export type StudentOption = {
  id: string;
  name: string;
  email: string;
  organizationId?: string;
  coachingCenterId?: string;
};

export type FeeTypeOption = {
  id: string;
  name: string;
  frequency: string;
  organizationId: string;
  coachingCenterId: string;
};

export type FeePlanOption = {
  id: string;
  name: string;
  academicYearId: string;
  organizationId: string;
  coachingCenterId: string;
};

// Field errors type
export type FieldErrors = Record<string, string>;

// Status type for form submissions
export type FormStatus = {
  type: 'idle' | 'loading' | 'success' | 'error';
  message: string;
};

// User form data
export type UserFormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
};

// Student with parent form data
export type StudentWithParentFormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  parentEmail: string;
  parentPassword: string;
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
};

// Organization form data
export type OrganizationFormData = {
  organizationName: string;
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
};

// Coaching center form data
export type CoachingCenterFormData = {
  coachingCenterName: string;
  coachingCenterCode: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
};

// Academic year form data
export type AcademicYearFormData = {
  name: string;
  startDate: string;
  endDate: string;
};

// Class/Program form data
export type ClassFormData = {
  name: string;
  level: string;
};

// Fee type form data
export type FeeTypeFormData = {
  name: string;
  amount: string;
  frequency: string;
  isMandatory: boolean;
  isTaxable: boolean;
};

// Fee plan form data
export type FeePlanFormData = {
  name: string;
  itemsJson: string;
};

// Student ledger form data
export type StudentLedgerFormData = {
  amount: string;
  dueDate: string;
};

// Fee frequency options
export const FEE_FREQUENCY_OPTIONS: SelectOption[] = [
  { value: 'ONE_TIME', label: 'One Time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

// Class level options
export const CLASS_LEVEL_OPTIONS: SelectOption[] = [
  { value: 'Pre-Primary', label: 'Pre-Primary' },
  { value: 'Primary', label: 'Primary' },
  { value: 'Middle School', label: 'Middle School' },
  { value: 'Secondary', label: 'Secondary' },
  { value: 'Senior Secondary', label: 'Senior Secondary' },
];

// Admin role options
export const ADMIN_ROLE_OPTIONS: SelectOption[] = [
  { value: UserRole.ORGANIZATION_ADMIN, label: 'Organization Admin' },
  { value: UserRole.COACHING_ADMIN, label: 'Coaching Admin' },
  { value: UserRole.ADMIN, label: 'Admin' },
];