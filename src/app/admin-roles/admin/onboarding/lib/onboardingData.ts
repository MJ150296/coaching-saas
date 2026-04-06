import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getAdminOrganizations, getAdminCoachingCenters } from '@/shared/lib/client/adminTenantReferenceData';
import { StepMeta } from '../components/types';

export type JsonRecord = Record<string, unknown>;
export type OrgOption = { id: string; name: string };
export type CoachingCenterOption = { id: string; name: string; organizationId: string };
export type AcademicYearOption = { id: string; name: string; startDate?: string; endDate?: string; organizationId: string; coachingCenterId: string };
export type ProgramOption = { id: string; name: string; code?: string; classLevel?: string; level?: string; organizationId: string; coachingCenterId: string };
export type BatchOption = { id: string; name: string; programId: string; capacity: number; organizationId: string; coachingCenterId: string };
export type TeacherOption = { id: string; name: string; email: string; organizationId?: string; coachingCenterId?: string };
export type StudentOption = { id: string; name: string; email: string; organizationId?: string; coachingCenterId?: string };
export type FeeTypeOption = { id: string; name: string; amount: number; frequency: string; organizationId: string; coachingCenterId: string };
export type FeePlanOption = { id: string; name: string; academicYearId: string; organizationId: string; coachingCenterId: string };

export const STEP_META: StepMeta[] = [
  { title: 'Bootstrap Check', description: 'Verify superadmin is ready before onboarding.' },
  { title: 'Create Organization', description: 'Create tenant root organization.' },
  { title: 'Create Coaching Center', description: 'Create coaching center under organization.' },
  { title: 'Create Admin Accounts', description: 'Create org/coaching/admin operators.' },
  { title: 'Academic Setup', description: 'Create academic year.' },
  { title: 'Teacher Setup', description: 'Create teacher.' },
  { title: 'Fees Setup', description: 'Create fee type/plan and assign plan to program.' },
  { title: 'Create Student + Parent', description: 'Create student with school grade and auto-link parent.' },
  { title: 'Student Ledger', description: 'Create student fee ledger entry.' },
  { title: 'Parent Handover', description: 'Share credentials and login instructions.' },
];

export const STEP_ALLOWED_ROLES: UserRole[][] = [
  [UserRole.SUPER_ADMIN],
  [UserRole.SUPER_ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
  [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
];


export function extractId(data: JsonRecord): string {
  if (typeof data.id === 'string') return data.id;
  if (typeof data._id === 'string') return data._id;
  if (typeof data.organizationId === 'string') return data.organizationId;
  if (typeof data.coachingCenterId === 'string') return data.coachingCenterId;
  if (typeof data.feeTypeId === 'string') return data.feeTypeId;
  if (typeof data.feePlanId === 'string') return data.feePlanId;
  if (typeof data.studentId === 'string') return data.studentId;
  if (typeof data.programId === 'string') return data.programId;
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

export async function fetchCoachingCenters(orgId?: string): Promise<CoachingCenterOption[]> {
  try {
    const data = await getAdminCoachingCenters(orgId);
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
    if (schId) params.set('coachingCenterId', schId);
    const query = params.toString();
    const response = await fetch(`/api/admin/academic-years${query ? `?${query}` : ''}`);
    const data = (await response.json()) as Array<{
      id?: string;
      name?: string;
      startDate?: string;
      endDate?: string;
      organizationId?: string;
      coachingCenterId?: string;
    }>;
    if (!response.ok || !Array.isArray(data)) return [];
    return data
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.organizationId === 'string' &&
          typeof row.coachingCenterId === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        startDate: typeof row.startDate === 'string' ? row.startDate : undefined,
        endDate: typeof row.endDate === 'string' ? row.endDate : undefined,
        organizationId: row.organizationId as string,
        coachingCenterId: row.coachingCenterId as string,
      }));
  } catch {
    return [];
  }
}

export async function fetchPrograms(orgId?: string, schId?: string): Promise<ProgramOption[]> {
  try {
    const params = new URLSearchParams();
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('coachingCenterId', schId);
    const query = params.toString();
    const response = await fetch(`/api/admin/coaching-programs${query ? `?${query}` : ''}`);
    const data = (await response.json()) as Array<{
      id?: string;
      name?: string;
      code?: string;
      classLevel?: string;
      organizationId?: string;
      coachingCenterId?: string;
    }>;
    if (!response.ok || !Array.isArray(data)) return [];
    return data
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.organizationId === 'string' &&
          typeof row.coachingCenterId === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        code: typeof row.code === 'string' ? row.code : undefined,
        classLevel: typeof row.classLevel === 'string' ? row.classLevel : undefined,
        organizationId: row.organizationId as string,
        coachingCenterId: row.coachingCenterId as string,
      }));
  } catch {
    return [];
  }
}

export async function fetchBatches(orgId?: string, schId?: string, programId?: string): Promise<BatchOption[]> {
  try {
    const params = new URLSearchParams();
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('coachingCenterId', schId);
    if (programId) params.set('programId', programId);
    const query = params.toString();
    const response = await fetch(`/api/admin/coaching-batches${query ? `?${query}` : ''}`);
    const data = (await response.json()) as Array<{
      id?: string;
      name?: string;
      programId?: string;
      capacity?: number;
      organizationId?: string;
      coachingCenterId?: string;
    }>;
    if (!response.ok || !Array.isArray(data)) return [];
    return data
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.programId === 'string' &&
          typeof row.organizationId === 'string' &&
          typeof row.coachingCenterId === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        programId: row.programId as string,
        capacity: typeof row.capacity === 'number' ? row.capacity : 0,
        organizationId: row.organizationId as string,
        coachingCenterId: row.coachingCenterId as string,
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
  coachingCenterId?: string;
}>> {
  try {
    const params = new URLSearchParams({ role });
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('coachingCenterId', schId);
    const response = await fetch(`/api/admin/users?${params.toString()}`);
    const data = (await response.json()) as Array<{
      id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      organizationId?: string;
      coachingCenterId?: string;
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
        coachingCenterId: typeof row.coachingCenterId === 'string' ? row.coachingCenterId : undefined,
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
    coachingCenterId: row.coachingCenterId,
  }));
}

export async function fetchStudents(orgId?: string, schId?: string): Promise<StudentOption[]> {
  const data = await fetchUsersByRole(UserRole.STUDENT, orgId, schId);
  return data.map((row) => ({
    id: row.id,
    name: `${row.firstName} ${row.lastName}`.trim(),
    email: row.email,
    organizationId: row.organizationId,
    coachingCenterId: row.coachingCenterId,
  }));
}

export async function fetchFeeTypes(orgId?: string, schId?: string): Promise<FeeTypeOption[]> {
  try {
    const params = new URLSearchParams();
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('coachingCenterId', schId);
    const query = params.toString();
    const response = await fetch(`/api/admin/fee-types${query ? `?${query}` : ''}`);
    const data = (await response.json()) as Array<{
      id?: string;
      name?: string;
      amount?: number;
      frequency?: string;
      organizationId?: string;
      coachingCenterId?: string;
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
          typeof row.coachingCenterId === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        amount: row.amount as number,
        frequency: row.frequency as string,
        organizationId: row.organizationId as string,
        coachingCenterId: row.coachingCenterId as string,
      }));
  } catch {
    return [];
  }
}

export async function fetchFeePlans(orgId?: string, schId?: string): Promise<FeePlanOption[]> {
  try {
    const params = new URLSearchParams();
    if (orgId) params.set('organizationId', orgId);
    if (schId) params.set('coachingCenterId', schId);
    const query = params.toString();
    const response = await fetch(`/api/admin/fee-plans${query ? `?${query}` : ''}`);
    const data = (await response.json()) as Array<{
      id?: string;
      name?: string;
      academicYearId?: string;
      organizationId?: string;
      coachingCenterId?: string;
    }>;
    if (!response.ok || !Array.isArray(data)) return [];
    return data
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.academicYearId === 'string' &&
          typeof row.organizationId === 'string' &&
          typeof row.coachingCenterId === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        academicYearId: row.academicYearId as string,
        organizationId: row.organizationId as string,
        coachingCenterId: row.coachingCenterId as string,
      }));
  } catch {
    return [];
  }
}
