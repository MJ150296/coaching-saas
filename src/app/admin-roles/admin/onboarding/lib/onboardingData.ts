import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getAdminOrganizations, getAdminSchools } from '@/shared/lib/client/adminTenantReferenceData';
import { StepMeta } from '../components/types';

export type JsonRecord = Record<string, unknown>;
export type OrgOption = { id: string; name: string };
export type SchoolOption = { id: string; name: string; organizationId: string };
export type AcademicYearOption = { id: string; name: string; startDate?: string; endDate?: string; organizationId: string; schoolId: string };
export type ClassOption = { id: string; name: string; level?: string; organizationId: string; schoolId: string };
export type TeacherOption = { id: string; name: string; email: string; organizationId?: string; schoolId?: string };
export type StudentOption = { id: string; name: string; email: string; organizationId?: string; schoolId?: string };
export type FeeTypeOption = { id: string; name: string; amount: number; frequency: string; organizationId: string; schoolId: string };
export type FeePlanOption = { id: string; name: string; academicYearId: string; organizationId: string; schoolId: string };
export type ClassLevelOption = { value: string; label: string };

export const STEP_META: StepMeta[] = [
  { title: 'Bootstrap Check', description: 'Verify superadmin is ready before onboarding.' },
  { title: 'Create Organization', description: 'Create tenant root organization.' },
  { title: 'Create School', description: 'Create school under organization.' },
  { title: 'Create Admin Accounts', description: 'Create org/school/admin operators.' },
  { title: 'Academic Setup', description: 'Create academic year and class master.' },
  { title: 'Teacher + Class Teacher', description: 'Create teacher and assign section class teacher.' },
  { title: 'Fees Setup', description: 'Create fee type/plan and assign plan to class.' },
  { title: 'Create Student + Parent', description: 'Create student and auto-link parent.' },
  { title: 'Student Ledger', description: 'Create student fee ledger entry.' },
  { title: 'Parent Handover', description: 'Share credentials and login instructions.' },
];

export const STEP_ALLOWED_ROLES: UserRole[][] = [
  [UserRole.SUPER_ADMIN],
  [UserRole.SUPER_ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
];

export const CLASS_LEVEL_OPTIONS: ClassLevelOption[] = [
  { value: 'LOWER_PRIMARY', label: 'Lower Primary (Classes 1-5)' },
  { value: 'UPPER_PRIMARY', label: 'Upper Primary (Classes 6-8)' },
  { value: 'SECONDARY', label: 'Secondary (Classes 9-10)' },
  { value: 'HIGHER_SECONDARY', label: 'Higher Secondary (Classes 11-12)' },
];

export function inferClassLevelFromName(className: string): string | undefined {
  const match = className.match(/\d+/);
  if (!match) return undefined;
  const classNumber = Number(match[0]);
  if (classNumber >= 1 && classNumber <= 5) return 'LOWER_PRIMARY';
  if (classNumber >= 6 && classNumber <= 8) return 'UPPER_PRIMARY';
  if (classNumber >= 9 && classNumber <= 10) return 'SECONDARY';
  if (classNumber >= 11 && classNumber <= 12) return 'HIGHER_SECONDARY';
  return undefined;
}

export function extractId(data: JsonRecord): string {
  if (typeof data.id === 'string') return data.id;
  if (typeof data._id === 'string') return data._id;
  if (typeof data.organizationId === 'string') return data.organizationId;
  if (typeof data.schoolId === 'string') return data.schoolId;
  if (typeof data.feeTypeId === 'string') return data.feeTypeId;
  if (typeof data.feePlanId === 'string') return data.feePlanId;
  if (typeof data.studentId === 'string') return data.studentId;
  if (typeof data.classMasterId === 'string') return data.classMasterId;
  if (typeof data.academicYearId === 'string') return data.academicYearId;
  const user = data.user as { id?: string } | undefined;
  if (typeof user?.id === 'string') return user.id;
  return '';
}

export async function fetchOrganizations(): Promise<OrgOption[]> {
  try {
    const data = await getAdminOrganizations();
    return data.map((row) => ({ id: row.id, name: row.name }));
  } catch {
    return [];
  }
}

export async function fetchSchools(orgId?: string): Promise<SchoolOption[]> {
  try {
    const data = await getAdminSchools(orgId);
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      organizationId: row.organizationId,
    }));
  } catch {
    return [];
  }
}

export async function fetchAcademicYears(orgId?: string, schId?: string): Promise<AcademicYearOption[]> {
  try {
    const params = new URLSearchParams();
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('schoolId', schId);
    const query = params.toString();
    const response = await fetch(`/api/admin/academic-years${query ? `?${query}` : ''}`);
    const data = (await response.json()) as Array<{
      id?: string;
      name?: string;
      startDate?: string;
      endDate?: string;
      organizationId?: string;
      schoolId?: string;
    }>;
    if (!response.ok || !Array.isArray(data)) return [];
    return data
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.organizationId === 'string' &&
          typeof row.schoolId === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        startDate: typeof row.startDate === 'string' ? row.startDate : undefined,
        endDate: typeof row.endDate === 'string' ? row.endDate : undefined,
        organizationId: row.organizationId as string,
        schoolId: row.schoolId as string,
      }));
  } catch {
    return [];
  }
}

export async function fetchClassMasters(orgId?: string, schId?: string): Promise<ClassOption[]> {
  try {
    const params = new URLSearchParams();
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('schoolId', schId);
    const query = params.toString();
    const response = await fetch(`/api/admin/class-masters${query ? `?${query}` : ''}`);
    const data = (await response.json()) as Array<{
      id?: string;
      name?: string;
      level?: string;
      organizationId?: string;
      schoolId?: string;
    }>;
    if (!response.ok || !Array.isArray(data)) return [];
    return data
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.organizationId === 'string' &&
          typeof row.schoolId === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        level: typeof row.level === 'string' ? row.level : undefined,
        organizationId: row.organizationId as string,
        schoolId: row.schoolId as string,
      }));
  } catch {
    return [];
  }
}

async function fetchUsersByRole(role: UserRole, orgId?: string, schId?: string): Promise<Array<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId?: string;
  schoolId?: string;
}>> {
  try {
    const params = new URLSearchParams({ role });
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('schoolId', schId);
    const response = await fetch(`/api/admin/users?${params.toString()}`);
    const data = (await response.json()) as Array<{
      id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      organizationId?: string;
      schoolId?: string;
    }>;
    if (!response.ok || !Array.isArray(data)) return [];
    return data
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.firstName === 'string' &&
          typeof row.lastName === 'string' &&
          typeof row.email === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        firstName: row.firstName as string,
        lastName: row.lastName as string,
        email: row.email as string,
        organizationId: typeof row.organizationId === 'string' ? row.organizationId : undefined,
        schoolId: typeof row.schoolId === 'string' ? row.schoolId : undefined,
      }));
  } catch {
    return [];
  }
}

export async function fetchTeachers(orgId?: string, schId?: string): Promise<TeacherOption[]> {
  const data = await fetchUsersByRole(UserRole.TEACHER, orgId, schId);
  return data.map((row) => ({
    id: row.id,
    name: `${row.firstName} ${row.lastName}`.trim(),
    email: row.email,
    organizationId: row.organizationId,
    schoolId: row.schoolId,
  }));
}

export async function fetchStudents(orgId?: string, schId?: string): Promise<StudentOption[]> {
  const data = await fetchUsersByRole(UserRole.STUDENT, orgId, schId);
  return data.map((row) => ({
    id: row.id,
    name: `${row.firstName} ${row.lastName}`.trim(),
    email: row.email,
    organizationId: row.organizationId,
    schoolId: row.schoolId,
  }));
}

export async function fetchFeeTypes(orgId?: string, schId?: string): Promise<FeeTypeOption[]> {
  try {
    const params = new URLSearchParams();
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('schoolId', schId);
    const query = params.toString();
    const response = await fetch(`/api/admin/fee-types${query ? `?${query}` : ''}`);
    const data = (await response.json()) as Array<{
      id?: string;
      name?: string;
      amount?: number;
      frequency?: string;
      organizationId?: string;
      schoolId?: string;
    }>;
    if (!response.ok || !Array.isArray(data)) return [];
    return data
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.amount === 'number' &&
          typeof row.frequency === 'string' &&
          typeof row.organizationId === 'string' &&
          typeof row.schoolId === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        amount: row.amount as number,
        frequency: row.frequency as string,
        organizationId: row.organizationId as string,
        schoolId: row.schoolId as string,
      }));
  } catch {
    return [];
  }
}

export async function fetchFeePlans(orgId?: string, schId?: string): Promise<FeePlanOption[]> {
  try {
    const params = new URLSearchParams();
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('schoolId', schId);
    const query = params.toString();
    const response = await fetch(`/api/admin/fee-plans${query ? `?${query}` : ''}`);
    const data = (await response.json()) as Array<{
      id?: string;
      name?: string;
      academicYearId?: string;
      organizationId?: string;
      schoolId?: string;
    }>;
    if (!response.ok || !Array.isArray(data)) return [];
    return data
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.academicYearId === 'string' &&
          typeof row.organizationId === 'string' &&
          typeof row.schoolId === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        academicYearId: row.academicYearId as string,
        organizationId: row.organizationId as string,
        schoolId: row.schoolId as string,
      }));
  } catch {
    return [];
  }
}
