import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import {
  AcademicYearModel,
} from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import {
  CoachingProgramModel,
  CoachingBatchModel,
} from '@/domains/coaching-management/infrastructure/persistence/CoachingSchema';
import { FeePlanModel, FeeTypeModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';
import { getActorUser } from '@/shared/infrastructure/actor';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { connectDB } from '@/shared/infrastructure/database';
import { getLogger } from '@/shared/infrastructure/logger';
import { getCachedValue, setCachedValue } from '@/shared/infrastructure/api-response-cache';

const ACADEMIC_OPTIONS_CACHE_PREFIX = 'api:admin:academic-options:';
const ACADEMIC_OPTIONS_CACHE_TTL_MS = 15_000;

export async function GET(request: NextRequest) {
  const logger = getLogger();
  const start = Date.now();
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = actor.getRole();
    if (
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ORGANIZATION_ADMIN &&
      role !== UserRole.COACHING_ADMIN &&
      role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId =
      request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedCoachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
    const includeStudents = request.nextUrl.searchParams.get('includeStudents') === 'true';
    const includeFees = request.nextUrl.searchParams.get('includeFees') === 'true';
    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);

    if (!tenant.organizationId || !tenant.coachingCenterId) {
      return NextResponse.json(
        { error: 'organizationId and coachingCenterId are required' },
        { status: 400 }
      );
    }

    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    const cacheKey = `${ACADEMIC_OPTIONS_CACHE_PREFIX}${actor.getId()}:${role}:${tenant.organizationId}:${tenant.coachingCenterId}:${includeStudents ? '1' : '0'}:${includeFees ? '1' : '0'}`;
    const cached = getCachedValue<unknown>(cacheKey);
    if (cached) {
      logger.debug('GET /api/admin/academic/options cache hit', {
        durationMs: Date.now() - start,
        role,
        includeStudents,
        includeFees,
      });
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        },
      });
    }

    await connectDB();
    const queryStart = Date.now();

    const [academicYearsRaw, programsRaw, batchesRaw, teachersRaw, studentsRaw, feeTypesRaw, feePlansRaw] =
      await Promise.all([
      AcademicYearModel.find({
        organizationId: tenant.organizationId,
        coachingCenterId: tenant.coachingCenterId,
      })
        .sort({ startDate: -1 })
        .lean<
          Array<{ _id: string; name: string }>
        >(),
      CoachingProgramModel.find({
        organizationId: tenant.organizationId,
        coachingCenterId: tenant.coachingCenterId,
      })
        .sort({ createdAt: -1 })
        .lean<
          Array<{ _id: string; name: string; code?: string; classLevel?: string }>
        >(),
      CoachingBatchModel.find({
        organizationId: tenant.organizationId,
        coachingCenterId: tenant.coachingCenterId,
      })
        .sort({ createdAt: -1 })
        .lean<
          Array<{ _id: string; name: string; programId: string; capacity: number }>
        >(),
      UserModel.find({
        role: UserRole.TEACHER,
        organizationId: tenant.organizationId,
        coachingCenterId: tenant.coachingCenterId,
      })
        .sort({ createdAt: -1 })
        .lean<
          Array<{ _id: string; firstName?: string; lastName?: string; email: string }>
        >(),
      includeStudents
        ? UserModel.find({
            role: UserRole.STUDENT,
            organizationId: tenant.organizationId,
            coachingCenterId: tenant.coachingCenterId,
          })
            .sort({ createdAt: -1 })
            .lean<
              Array<{ _id: string; firstName?: string; lastName?: string; email: string }>
            >()
        : Promise.resolve([] as Array<{ _id: string; firstName?: string; lastName?: string; email: string }>),
      includeFees
        ? FeeTypeModel.find({
            organizationId: tenant.organizationId,
            coachingCenterId: tenant.coachingCenterId,
          })
            .sort({ createdAt: -1 })
            .lean<Array<{ _id: string; name: string }>>()
        : Promise.resolve([] as Array<{ _id: string; name: string }>),
      includeFees
        ? FeePlanModel.find({
            organizationId: tenant.organizationId,
            coachingCenterId: tenant.coachingCenterId,
          })
            .sort({ createdAt: -1 })
            .lean<Array<{ _id: string; name: string }>>()
        : Promise.resolve([] as Array<{ _id: string; name: string }>),
    ]);

    const payload = {
      academicYears: academicYearsRaw.map((item) => ({
        id: item._id,
        name: item.name,
      })),
      programs: programsRaw.map((item) => ({
        id: item._id,
        name: item.name,
        code: item.code,
      })),
      batches: batchesRaw.map((item) => ({
        id: item._id,
        name: item.name,
        programId: item.programId,
        capacity: item.capacity,
      })),
      teachers: teachersRaw.map((item) => ({
        id: item._id,
        name: `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email,
        email: item.email,
      })),
      students: studentsRaw.map((item) => ({
        id: item._id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
      })),
      feeTypes: feeTypesRaw.map((item) => ({
        id: item._id,
        name: item.name,
      })),
      feePlans: feePlansRaw.map((item) => ({
        id: item._id,
        name: item.name,
      })),
    };
    setCachedValue(cacheKey, payload, ACADEMIC_OPTIONS_CACHE_TTL_MS);
    logger.info('GET /api/admin/academic/options', {
      durationMs: Date.now() - start,
      queryMs: Date.now() - queryStart,
      role,
      includeStudents,
      includeFees,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      counts: {
        academicYears: payload.academicYears.length,
        programs: payload.programs.length,
        batches: payload.batches.length,
        teachers: payload.teachers.length,
        students: payload.students.length,
        feeTypes: payload.feeTypes.length,
        feePlans: payload.feePlans.length,
      },
    });
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    logger.error('GET /api/admin/academic/options failed', error instanceof Error ? error : undefined, {
      durationMs: Date.now() - start,
    });
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
