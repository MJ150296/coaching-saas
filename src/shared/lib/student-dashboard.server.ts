import { User, UserRole } from '@/domains/user-management/domain/entities/User';
import {
  AcademicYearModel,
  StudentEnrollmentModel,
  SubjectAllocationModel,
  TimetableEntryModel,
} from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import {
  CoachingProgramModel,
  CoachingBatchModel,
} from '@/domains/coaching-management/infrastructure/persistence/CoachingSchema';
import { StudentFeeLedgerModel, PaymentModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { connectDB } from '@/shared/infrastructure/database';

type EnrollmentDoc = {
  _id: string;
  academicYearId: string;
  programId: string;
  batchId: string;
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

export type StudentDashboardPayload = {
  summary: {
    totalSubjects: number;
    todayPrograms: number;
    pendingDues: number;
    feeClearance: number;
  };
  programLabel: string;
  subjects: Array<{
    id: string;
    name: string;
    teacher: string;
    grade: string;
    progress: number;
  }>;
  todaySchedule: Array<{
    id: string;
    subject: string;
    slot: string;
    periodNumber: number;
  }>;
  dueItems: Array<{
    id: string;
    title: string;
    dueDate: string;
    amount: number;
    status: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    method: string;
    reference?: string;
    paidAt: string;
  }>;
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

export async function getStudentDashboardData(actor: User): Promise<StudentDashboardPayload> {
  if (actor.getRole() !== UserRole.STUDENT) {
    throw new Error('FORBIDDEN');
  }

  const organizationId = actor.getOrganizationId();
  const coachingCenterId = actor.getCoachingCenterId();
  const studentId = actor.getId();
  if (!organizationId || !coachingCenterId) {
    return {
      summary: { totalSubjects: 0, todayPrograms: 0, pendingDues: 0, feeClearance: 0 },
      programLabel: '',
      subjects: [],
      todaySchedule: [],
      dueItems: [],
      recentPayments: [],
    };
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
    return {
      summary: { totalSubjects: 0, todayPrograms: 0, pendingDues: 0, feeClearance: 0 },
      programLabel: '',
      subjects: [],
      todaySchedule: [],
      dueItems: [],
      recentPayments: [],
    };
  }

  const [program, batch] = await Promise.all([
    CoachingProgramModel.findById(enrollment.programId).lean<{ _id: string; name: string } | null>(),
    CoachingBatchModel.findById(enrollment.batchId).lean<{ _id: string; name: string } | null>(),
  ]);

  const batchScopedOrProgramLevel = [
    { batchId: enrollment.batchId },
    { batchId: { $exists: false } },
    { batchId: null },
    { batchId: '' },
  ];

  const [subjectAllocations, scheduledCounts, todayScheduleEntries, dueItems, recentPayments, totalLedgerCount, paidLedgerCount] =
    await Promise.all([
      SubjectAllocationModel.find({
        organizationId,
        coachingCenterId,
        academicYearId: enrollment.academicYearId,
        programId: enrollment.programId,
        $or: batchScopedOrProgramLevel,
      }).lean<Array<SubjectAllocationDoc>>(),
      TimetableEntryModel.aggregate<TimetableCountDoc>([
        {
          $match: {
            organizationId,
            coachingCenterId,
            academicYearId: enrollment.academicYearId,
            programId: enrollment.programId,
            $or: batchScopedOrProgramLevel,
          },
        },
        { $group: { _id: '$sourceAllocationId', count: { $sum: 1 } } },
      ]),
      TimetableEntryModel.find({
        organizationId,
        coachingCenterId,
        academicYearId: enrollment.academicYearId,
        programId: enrollment.programId,
        dayOfWeek: WEEK_DAYS[new Date().getDay()],
        $or: batchScopedOrProgramLevel,
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
  const programName = program?.name ?? enrollment.programId;
  const batchName = batch?.name ?? enrollment.batchId;

  return {
    summary: {
      totalSubjects: uniqueSubjects.size,
      todayPrograms: todayScheduleEntries.length,
      pendingDues: dueItems.length,
      feeClearance,
    },
    programLabel: `${programName} - ${batchName}`,
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
  };
}
