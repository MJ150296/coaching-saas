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
import { getActorUser } from '@/shared/infrastructure/actor';
import { connectDB } from '@/shared/infrastructure/database';

const WEEK_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

type AllocationDoc = {
  _id: string;
  classMasterId: string;
  sectionId?: string;
  subjectName: string;
  weeklyPeriods?: number;
};

type TimetableDoc = {
  _id: string;
  classMasterId: string;
  sectionId?: string;
  subjectName: string;
  periodNumber: number;
  sourceAllocationId: string;
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

export async function GET() {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (actor.getRole() !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizationId = actor.getOrganizationId();
    const schoolId = actor.getSchoolId();
    if (!organizationId || !schoolId) {
      return NextResponse.json({
        summary: { totalClasses: 0, totalStudents: 0, pendingTasks: 0, completedTasks: 0 },
        todayClasses: [],
        tasks: [],
      });
    }

    await connectDB();

    const [activeYear, allocations, todayEntries] = await Promise.all([
      AcademicYearModel.findOne({ organizationId, schoolId, isActive: true }).sort({ startDate: -1 }).lean(),
      SubjectAllocationModel.find({
        organizationId,
        schoolId,
        teacherId: actor.getId(),
      })
        .sort({ createdAt: -1 })
        .lean<Array<AllocationDoc>>(),
      TimetableEntryModel.find({
        organizationId,
        schoolId,
        teacherId: actor.getId(),
        dayOfWeek: WEEK_DAYS[new Date().getDay()],
      })
        .sort({ periodNumber: 1 })
        .lean<Array<TimetableDoc>>(),
    ]);

    const allocationIds = allocations.map((item) => item._id);
    const classMasterIds = Array.from(new Set(allocations.map((item) => item.classMasterId)));
    const sectionIds = Array.from(new Set(allocations.map((item) => item.sectionId).filter(Boolean))) as string[];

    const [scheduledCountsRaw, classMasters, sections] = await Promise.all([
      allocationIds.length > 0
        ? TimetableEntryModel.aggregate<{ _id: string; count: number }>([
            { $match: { sourceAllocationId: { $in: allocationIds } } },
            { $group: { _id: '$sourceAllocationId', count: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      classMasterIds.length > 0
        ? ClassMasterModel.find({ _id: { $in: classMasterIds } }).lean<Array<{ _id: string; name: string }>>()
        : Promise.resolve([]),
      sectionIds.length > 0
        ? SectionModel.find({ _id: { $in: sectionIds } }).lean<Array<{ _id: string; name: string; roomNumber?: string }>>()
        : Promise.resolve([]),
    ]);

    const enrollmentQuery: Record<string, unknown> = {
      organizationId,
      schoolId,
      classMasterId: { $in: classMasterIds },
    };
    if (activeYear?._id) {
      enrollmentQuery.academicYearId = activeYear._id;
    }

    const enrollments =
      classMasterIds.length > 0
        ? await StudentEnrollmentModel.find(enrollmentQuery).lean<Array<{ classMasterId: string; sectionId: string }>>()
        : [];

    const classNameMap = new Map(classMasters.map((item) => [item._id, item.name]));
    const sectionMap = new Map(sections.map((item) => [item._id, item]));
    const scheduledCountMap = new Map(scheduledCountsRaw.map((item) => [item._id, item.count]));

    const classStudentCountMap = new Map<string, number>();
    for (const enrollment of enrollments) {
      const key = `${enrollment.classMasterId}::${enrollment.sectionId || ''}`;
      classStudentCountMap.set(key, (classStudentCountMap.get(key) ?? 0) + 1);
    }

    const seenClassKeys = new Set<string>();
    let totalStudents = 0;
    for (const allocation of allocations) {
      const key = `${allocation.classMasterId}::${allocation.sectionId || ''}`;
      if (!seenClassKeys.has(key)) {
        seenClassKeys.add(key);
        totalStudents += classStudentCountMap.get(key) ?? 0;
      }
    }

    const tasks = allocations.slice(0, 8).map((allocation, index) => {
      const scheduledCount = scheduledCountMap.get(allocation._id) ?? 0;
      const weeklyPeriods = Number(allocation.weeklyPeriods ?? 0);
      const status =
        weeklyPeriods > 0 && scheduledCount >= weeklyPeriods
          ? 'completed'
          : scheduledCount > 0
          ? 'in-review'
          : 'pending';

      const className = classNameMap.get(allocation.classMasterId) ?? allocation.classMasterId;
      const sectionName = allocation.sectionId ? sectionMap.get(allocation.sectionId)?.name ?? allocation.sectionId : '';

      return {
        id: allocation._id,
        title: `Plan update: ${allocation.subjectName}`,
        classLabel: sectionName ? `${className} - ${sectionName}` : className,
        dueDate: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
        status,
      };
    });

    const pendingTasks = tasks.filter((item) => item.status !== 'completed').length;
    const completedTasks = tasks.filter((item) => item.status === 'completed').length;

    const todayClasses = todayEntries.map((entry) => {
      const className = classNameMap.get(entry.classMasterId) ?? entry.classMasterId;
      const section = entry.sectionId ? sectionMap.get(entry.sectionId) : undefined;
      const classLabel = section?.name ? `${className} - ${section.name}` : className;
      const studentCount = classStudentCountMap.get(`${entry.classMasterId}::${entry.sectionId || ''}`) ?? 0;

      return {
        id: entry._id,
        classLabel,
        subject: entry.subjectName,
        slot: periodToSlot(entry.periodNumber),
        room: section?.roomNumber || 'TBD',
        studentCount,
      };
    });

    return NextResponse.json({
      summary: {
        totalClasses: seenClassKeys.size,
        totalStudents,
        pendingTasks,
        completedTasks,
      },
      todayClasses,
      tasks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
