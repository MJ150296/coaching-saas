import { NextResponse } from 'next/server';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import {
  AcademicYearModel,
  ClassMasterModel,
  SectionModel,
  StudentEnrollmentModel,
  SubjectAllocationModel,
  TimetableEntryModel,
} from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import { StudentFeeLedgerModel, PaymentModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { getActorUser } from '@/shared/infrastructure/actor';
import { connectDB } from '@/shared/infrastructure/database';

type EnrollmentDoc = {
  _id: string;
  academicYearId: string;
  classMasterId: string;
  sectionId: string;
  createdAt: Date;
};

type SubjectAllocationDoc = {
  _id: string;
  subjectName: string;
  teacherId?: string;
  weeklyPeriods?: number;
};

type TimetableCountDoc = {
  _id: string;
  count: number;
};

type TimetableTodayDoc = {
  _id: string;
  subjectName: string;
  periodNumber: number;
};

type LedgerDoc = {
  _id: string;
  amount: number;
  dueDate: Date;
  status: string;
};

type PaymentDoc = {
  _id: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt: Date;
};

const WEEK_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

function periodToSlot(periodNumber: number): string {
  const periodDurationMinutes = 45;
  const startMinutes = (periodNumber - 1) * periodDurationMinutes + 9 * 60;
  const endMinutes = startMinutes + periodDurationMinutes;

  const format = (minutes: number) => {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return `${format(startMinutes)} - ${format(endMinutes)}`;
}

function progressToGrade(progress: number): string {
  if (progress >= 90) return 'A';
  if (progress >= 80) return 'B';
  if (progress >= 70) return 'C';
  if (progress >= 60) return 'D';
  return 'E';
}

export async function GET() {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (actor.getRole() !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizationId = actor.getOrganizationId();
    const coachingCenterId = actor.getCoachingCenterId();
    const studentId = actor.getId();
    if (!organizationId || !coachingCenterId) {
      return NextResponse.json({
        summary: { totalSubjects: 0, todayClasses: 0, pendingDues: 0, feeClearance: 0 },
        classLabel: '',
        subjects: [],
        todaySchedule: [],
        dueItems: [],
        recentPayments: [],
      });
    }

    await connectDB();

    const activeYear = await AcademicYearModel.findOne({ organizationId, coachingCenterId, isActive: true })
      .sort({ startDate: -1 })
      .lean<{ _id: string } | null>();

    const primaryQuery: Record<string, string> = { organizationId, coachingCenterId, studentId };
    if (activeYear?._id) {
      primaryQuery.academicYearId = activeYear._id;
    }

    const enrollment =
      (await StudentEnrollmentModel.findOne(primaryQuery)
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean<EnrollmentDoc | null>()) ??
      (await StudentEnrollmentModel.findOne({ organizationId, coachingCenterId, studentId })
        .sort({ createdAt: -1 })
        .lean<EnrollmentDoc | null>());

    if (!enrollment) {
      return NextResponse.json({
        summary: { totalSubjects: 0, todayClasses: 0, pendingDues: 0, feeClearance: 0 },
        classLabel: '',
        subjects: [],
        todaySchedule: [],
        dueItems: [],
        recentPayments: [],
      });
    }

    const [classMaster, section] = await Promise.all([
      ClassMasterModel.findById(enrollment.classMasterId).lean<{ _id: string; name: string } | null>(),
      SectionModel.findById(enrollment.sectionId).lean<{ _id: string; name: string } | null>(),
    ]);

    const sectionScopedOrClassLevel = [
      { sectionId: enrollment.sectionId },
      { sectionId: { $exists: false } },
      { sectionId: null },
      { sectionId: '' },
    ];

    const [subjectAllocations, scheduledCounts, todayScheduleEntries, dueItems, recentPayments, totalLedgerCount, paidLedgerCount] =
      await Promise.all([
        SubjectAllocationModel.find({
          organizationId,
          coachingCenterId,
          academicYearId: enrollment.academicYearId,
          classMasterId: enrollment.classMasterId,
          $or: sectionScopedOrClassLevel,
        }).lean<Array<SubjectAllocationDoc>>(),
        TimetableEntryModel.aggregate<TimetableCountDoc>([
          {
            $match: {
              organizationId,
              coachingCenterId,
              academicYearId: enrollment.academicYearId,
              classMasterId: enrollment.classMasterId,
              $or: sectionScopedOrClassLevel,
            },
          },
          { $group: { _id: '$sourceAllocationId', count: { $sum: 1 } } },
        ]),
        TimetableEntryModel.find({
          organizationId,
          coachingCenterId,
          academicYearId: enrollment.academicYearId,
          classMasterId: enrollment.classMasterId,
          dayOfWeek: WEEK_DAYS[new Date().getDay()],
          $or: sectionScopedOrClassLevel,
        })
          .sort({ periodNumber: 1 })
          .lean<Array<TimetableTodayDoc>>(),
        StudentFeeLedgerModel.find({
          organizationId,
          coachingCenterId,
          academicYearId: enrollment.academicYearId,
          studentId,
          status: { $ne: 'PAID' },
        })
          .sort({ dueDate: 1 })
          .limit(8)
          .lean<Array<LedgerDoc>>(),
        PaymentModel.find({
          organizationId,
          coachingCenterId,
          academicYearId: enrollment.academicYearId,
          studentId,
        })
          .sort({ paidAt: -1 })
          .limit(6)
          .lean<Array<PaymentDoc>>(),
        StudentFeeLedgerModel.countDocuments({
          organizationId,
          coachingCenterId,
          academicYearId: enrollment.academicYearId,
          studentId,
        }),
        StudentFeeLedgerModel.countDocuments({
          organizationId,
          coachingCenterId,
          academicYearId: enrollment.academicYearId,
          studentId,
          status: 'PAID',
        }),
      ]);

    const teacherIds = Array.from(
      new Set(
        subjectAllocations
          .map((allocation) => allocation.teacherId)
          .filter((teacherId): teacherId is string => Boolean(teacherId))
      )
    );

    const teachers =
      teacherIds.length > 0
        ? await UserModel.find({ _id: { $in: teacherIds }, role: UserRole.TEACHER })
            .select('_id firstName lastName')
            .lean<Array<{ _id: string; firstName: string; lastName: string }>>()
        : [];

    const teacherMap = new Map(
      teachers.map((teacher) => [
        teacher._id,
        `${teacher.firstName} ${teacher.lastName}`.trim() || teacher._id,
      ])
    );

    const scheduledCountMap = new Map(
      scheduledCounts.map((item) => [item._id, Number(item.count ?? 0)])
    );

    const uniqueSubjects = new Map<
      string,
      { id: string; name: string; teacher: string; grade: string; progress: number }
    >();

    for (const allocation of subjectAllocations) {
      const key = allocation.subjectName.trim().toLowerCase();
      if (uniqueSubjects.has(key)) continue;

      const scheduled = scheduledCountMap.get(allocation._id) ?? 0;
      const weeklyPeriods = Math.max(1, Number(allocation.weeklyPeriods ?? 0) || 1);
      const progress = Math.min(100, Math.round((scheduled / weeklyPeriods) * 100));
      uniqueSubjects.set(key, {
        id: allocation._id,
        name: allocation.subjectName,
        teacher: allocation.teacherId ? teacherMap.get(allocation.teacherId) ?? allocation.teacherId : 'Not assigned',
        grade: progressToGrade(progress),
        progress,
      });
    }

    const feeClearance = totalLedgerCount > 0 ? Math.round((paidLedgerCount / totalLedgerCount) * 100) : 0;
    const className = classMaster?.name ?? enrollment.classMasterId;
    const sectionName = section?.name ?? enrollment.sectionId;

    return NextResponse.json({
      summary: {
        totalSubjects: uniqueSubjects.size,
        todayClasses: todayScheduleEntries.length,
        pendingDues: dueItems.length,
        feeClearance,
      },
      classLabel: `${className} - ${sectionName}`,
      subjects: Array.from(uniqueSubjects.values()),
      todaySchedule: todayScheduleEntries.map((entry) => ({
        id: entry._id,
        subject: entry.subjectName,
        slot: periodToSlot(entry.periodNumber),
        periodNumber: entry.periodNumber,
      })),
      dueItems: dueItems.map((item) => ({
        id: item._id,
        title: `Fee due`,
        dueDate: new Date(item.dueDate).toISOString(),
        amount: Number(item.amount ?? 0),
        status: item.status,
      })),
      recentPayments: recentPayments.map((item) => ({
        id: item._id,
        amount: Number(item.amount ?? 0),
        method: item.method,
        reference: item.reference,
        paidAt: new Date(item.paidAt).toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
