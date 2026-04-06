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
import { connectDB } from '@/shared/infrastructure/database';

const WEEK_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

type AllocationDoc = {
  _id: string;
  programId: string;
  batchId?: string;
  subjectName: string;
  weeklyPeriods?: number;
};

type TimetableDoc = {
  _id: string;
  programId: string;
  batchId?: string;
  subjectName: string;
  periodNumber: number;
  sourceAllocationId: string;
};

export type TeacherDashboardClassItem = {
  id: string;
  programLabel: string;
  subject: string;
  slot: string;
  room: string;
  studentCount: number;
};

export type TeacherDashboardTaskItem = {
  id: string;
  title: string;
  programLabel: string;
  dueDate: string;
  status: 'pending' | 'in-review' | 'completed';
};

export type TeacherDashboardPayload = {
  summary: {
    totalPrograms: number;
    totalStudents: number;
    pendingTasks: number;
    completedTasks: number;
  };
  todayClasses: TeacherDashboardClassItem[];
  tasks: TeacherDashboardTaskItem[];
};

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

export async function getTeacherDashboardData(actor: User): Promise<TeacherDashboardPayload> {
  if (actor.getRole() !== UserRole.TEACHER) {
    throw new Error('FORBIDDEN');
  }

  const organizationId = actor.getOrganizationId();
  const coachingCenterId = actor.getCoachingCenterId();
  if (!organizationId || !coachingCenterId) {
    return {
      summary: { totalPrograms: 0, totalStudents: 0, pendingTasks: 0, completedTasks: 0 },
      todayClasses: [],
      tasks: [],
    };
  }

  await connectDB();

  const [activeYear, allocations, todayEntries] = await Promise.all([
    AcademicYearModel.findOne({ organizationId, coachingCenterId, isActive: true }).sort({ startDate: -1 }).lean(),
    SubjectAllocationModel.find({
      organizationId,
      coachingCenterId,
      teacherId: actor.getId(),
    })
      .sort({ createdAt: -1 })
      .lean<Array<AllocationDoc>>(),
    TimetableEntryModel.find({
      organizationId,
      coachingCenterId,
      teacherId: actor.getId(),
      dayOfWeek: WEEK_DAYS[new Date().getDay()],
    })
      .sort({ periodNumber: 1 })
      .lean<Array<TimetableDoc>>(),
  ]);

  const allocationIds = allocations.map((item) => item._id);
  const programIds = Array.from(new Set(allocations.map((item) => item.programId)));
  const batchIds = Array.from(new Set(allocations.map((item) => item.batchId).filter(Boolean))) as string[];

  const [scheduledCountsRaw, programs, batches] = await Promise.all([
    allocationIds.length > 0
      ? TimetableEntryModel.aggregate<{ _id: string; count: number }>([
          { $match: { sourceAllocationId: { $in: allocationIds } } },
          { $group: { _id: '$sourceAllocationId', count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
    programIds.length > 0
      ? CoachingProgramModel.find({ _id: { $in: programIds } }).lean<Array<{ _id: string; name: string }>>()
      : Promise.resolve([]),
    batchIds.length > 0
      ? CoachingBatchModel.find({ _id: { $in: batchIds } }).lean<Array<{ _id: string; name: string; roomNumber?: string }>>()
      : Promise.resolve([]),
  ]);

  const enrollmentQuery: Record<string, unknown> = {
    organizationId,
    coachingCenterId,
    programId: { $in: programIds },
  };
  if (activeYear?._id) {
    enrollmentQuery.academicYearId = activeYear._id;
  }

  const enrollments =
    programIds.length > 0
      ? await StudentEnrollmentModel.find(enrollmentQuery).lean<Array<{ programId: string; batchId: string }>>()
      : [];

  const programNameMap = new Map(programs.map((item) => [item._id, item.name]));
  const batchMap = new Map(batches.map((item) => [item._id, item]));
  const scheduledCountMap = new Map(scheduledCountsRaw.map((item) => [item._id, item.count]));

  const programStudentCountMap = new Map<string, number>();
  for (const enrollment of enrollments) {
    const key = `${enrollment.programId}::${enrollment.batchId || ''}`;
    programStudentCountMap.set(key, (programStudentCountMap.get(key) ?? 0) + 1);
  }

  const seenProgramKeys = new Set<string>();
  let totalStudents = 0;
  for (const allocation of allocations) {
    const key = `${allocation.programId}::${allocation.batchId || ''}`;
    if (!seenProgramKeys.has(key)) {
      seenProgramKeys.add(key);
      totalStudents += programStudentCountMap.get(key) ?? 0;
    }
  }

  const tasks: TeacherDashboardTaskItem[] = allocations.slice(0, 8).map((allocation, index) => {
    const scheduledCount = scheduledCountMap.get(allocation._id) ?? 0;
    const weeklyPeriods = Number(allocation.weeklyPeriods ?? 0);
    const status =
      weeklyPeriods > 0 && scheduledCount >= weeklyPeriods
        ? 'completed'
        : scheduledCount > 0
        ? 'in-review'
        : 'pending';

    const programName = programNameMap.get(allocation.programId) ?? allocation.programId;
    const batchName = allocation.batchId ? batchMap.get(allocation.batchId)?.name ?? allocation.batchId : '';

    return {
      id: allocation._id,
      title: `Plan update: ${allocation.subjectName}`,
      programLabel: batchName ? `${programName} - ${batchName}` : programName,
      dueDate: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
      status,
    };
  });

  const pendingTasks = tasks.filter((item) => item.status !== 'completed').length;
  const completedTasks = tasks.filter((item) => item.status === 'completed').length;

  const todayClasses: TeacherDashboardClassItem[] = todayEntries.map((entry) => {
    const programName = programNameMap.get(entry.programId) ?? entry.programId;
    const batch = entry.batchId ? batchMap.get(entry.batchId) : undefined;
    const programLabel = batch?.name ? `${programName} - ${batch.name}` : programName;
    const studentCount = programStudentCountMap.get(`${entry.programId}::${entry.batchId || ''}`) ?? 0;

    return {
      id: entry._id,
      programLabel,
      subject: entry.subjectName,
      slot: periodToSlot(entry.periodNumber),
      room: batch?.roomNumber || 'TBD',
      studentCount,
    };
  });

  return {
    summary: {
      totalPrograms: seenProgramKeys.size,
      totalStudents,
      pendingTasks,
      completedTasks,
    },
    todayClasses,
    tasks,
  };
}
