import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { connectDB } from '@/shared/infrastructure/database';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import {
  ClassMasterModel,
  SectionModel,
  StudentEnrollmentModel,
} from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import {
  CreditNoteModel,
  PaymentModel,
  StudentFeeLedgerModel,
} from '@/domains/fee-management/infrastructure/persistence/FeeSchema';
import {
  CoachingAttendanceModel,
  CoachingEnrollmentModel,
  CoachingSessionModel,
} from '@/domains/coaching-management/infrastructure/persistence/CoachingSchema';

const ADMIN_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.ORGANIZATION_ADMIN,
  UserRole.COACHING_ADMIN,
  UserRole.ADMIN,
]);

type TenantQuery = {
  organizationId?: string;
  coachingCenterId?: string;
};

type MonthSeries = {
  labels: string[];
  keys: string[];
};

function round(value: number, places = 2): number {
  const p = 10 ** places;
  return Math.round(value * p) / p;
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return round((part / total) * 100, 2);
}

function safeRatio(a: number, b: number): number {
  if (!b) return 0;
  return round(a / b, 2);
}

function formatDate(value?: Date): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthSeries(months = 12): MonthSeries {
  const now = new Date();
  const labels: string[] = [];
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
    labels.push(
      d.toLocaleDateString('en-IN', {
        month: 'short',
        year: '2-digit',
      })
    );
  }
  return { labels, keys };
}

function herfindahlIndex(values: number[]): number {
  const total = values.reduce((sum, v) => sum + v, 0);
  if (!total) return 0;
  return round(
    values.reduce((sum, v) => {
      const share = v / total;
      return sum + share * share;
    }, 0) * 10_000,
    0
  );
}

function gini(values: number[]): number {
  const arr = values.filter((v) => v >= 0).sort((a, b) => a - b);
  const n = arr.length;
  if (!n) return 0;
  const total = arr.reduce((sum, v) => sum + v, 0);
  if (!total) return 0;

  let weighted = 0;
  for (let i = 0; i < n; i += 1) {
    weighted += (i + 1) * arr[i];
  }
  return round((2 * weighted) / (n * total) - (n + 1) / n, 3);
}

async function resolveScope(): Promise<TenantQuery> {
  const actor = await getActorUser();
  if (!actor) throw new Error('Unauthorized');
  if (!ADMIN_ROLES.has(actor.getRole())) throw new Error('Forbidden');

  if (actor.getRole() === UserRole.SUPER_ADMIN) {
    return {};
  }

  const organizationId = actor.getOrganizationId();
  if (!organizationId) {
    throw new Error('Actor organization scope missing');
  }

  if (actor.getRole() === UserRole.ORGANIZATION_ADMIN) {
    return { organizationId };
  }

  const coachingCenterId = actor.getCoachingCenterId();
  if (!coachingCenterId) {
    throw new Error('Actor coaching center scope missing');
  }

  return { organizationId, coachingCenterId };
}

export async function getUsersEnterpriseAnalytics() {
  await connectDB();
  const scope = await resolveScope();

  const users = await UserModel.find(scope)
    .select('_id role isActive emailVerified createdAt coachingCenterId')
    .lean<
      Array<{
        _id: string;
        role: UserRole;
        isActive: boolean;
        emailVerified: boolean;
        createdAt: Date;
        coachingCenterId?: string;
      }>
    >();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const verifiedUsers = users.filter((u) => u.emailVerified).length;

  const roleOrder: UserRole[] = [
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STAFF,
    UserRole.ADMIN,
    UserRole.COACHING_ADMIN,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.SUPER_ADMIN,
  ];

  const roleCount = new Map<UserRole, number>();
  for (const role of roleOrder) roleCount.set(role, 0);
  for (const user of users) {
    roleCount.set(user.role, (roleCount.get(user.role) ?? 0) + 1);
  }

  const roleBreakdown = roleOrder
    .map((role) => ({
      role,
      count: roleCount.get(role) ?? 0,
      sharePct: pct(roleCount.get(role) ?? 0, totalUsers),
    }))
    .filter((item) => item.count > 0);

  const now = new Date();
  const recentStart = new Date(now);
  recentStart.setDate(now.getDate() - 30);
  const previousStart = new Date(recentStart);
  previousStart.setDate(recentStart.getDate() - 30);

  const recentCount = users.filter((u) => new Date(u.createdAt) >= recentStart).length;
  const previousCount = users.filter(
    (u) => new Date(u.createdAt) >= previousStart && new Date(u.createdAt) < recentStart
  ).length;

  const growthPct = previousCount
    ? round(((recentCount - previousCount) / previousCount) * 100, 2)
    : recentCount
      ? 100
      : 0;

  const monthSeries = buildMonthSeries(12);
  const monthMap = new Map<string, number>();
  for (const key of monthSeries.keys) monthMap.set(key, 0);
  for (const user of users) {
    const key = monthKey(new Date(user.createdAt));
    if (!monthMap.has(key)) continue;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }

  const monthlyNewUsers = monthSeries.keys.map((key) => monthMap.get(key) ?? 0);

  const centerCoverage = new Set(
    users.map((u) => u.coachingCenterId).filter((v): v is string => typeof v === 'string' && v.length > 0)
  ).size;

  const unverifiedActiveUsers = users.filter((u) => u.isActive && !u.emailVerified).length;
  const onboardingRiskScore = round(
    pct(totalUsers - activeUsers, totalUsers) * 0.6 + pct(unverifiedActiveUsers, totalUsers) * 0.4,
    2
  );

  return {
    summary: {
      totalUsers,
      activeUsers,
      verifiedUsers,
      activationRatePct: pct(activeUsers, totalUsers),
      verificationRatePct: pct(verifiedUsers, totalUsers),
      recentJoiners30d: recentCount,
      growthPct,
      centerCoverage,
      roleConcentrationHHI: herfindahlIndex(roleBreakdown.map((r) => r.count)),
      onboardingRiskScore,
    },
    roleBreakdown,
    monthlyTrend: {
      labels: monthSeries.labels,
      newUsers: monthlyNewUsers,
    },
    complianceWatchlist: users
      .filter((u) => !u.emailVerified || !u.isActive)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
      .slice(0, 8)
      .map((u) => ({
        id: u._id,
        role: u.role,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        createdAt: formatDate(u.createdAt),
      })),
  };
}

export async function getFeesEnterpriseAnalytics() {
  await connectDB();
  const scope = await resolveScope();

  const [ledger, payments, credits, students] = await Promise.all([
    StudentFeeLedgerModel.find(scope)
      .select('studentId amount dueDate status')
      .lean<Array<{ studentId: string; amount: number; dueDate: Date; status: string }>>(),
    PaymentModel.find(scope)
      .select('studentId amount paidAt method')
      .lean<Array<{ studentId: string; amount: number; paidAt: Date; method: string }>>(),
    CreditNoteModel.find(scope)
      .select('studentId amount')
      .lean<Array<{ studentId: string; amount: number }>>(),
    UserModel.find({ ...scope, role: UserRole.STUDENT })
      .select('_id firstName lastName email')
      .lean<Array<{ _id: string; firstName?: string; lastName?: string; email: string }>>(),
  ]);

  const studentNameMap = new Map<string, string>();
  for (const student of students) {
    const name = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.email;
    studentNameMap.set(student._id, name);
  }

  const totalBilled = ledger.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalCredits = credits.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const now = new Date();
  const unpaid = ledger.filter((item) => String(item.status).toUpperCase() !== 'PAID');
  const overdue = unpaid.filter((item) => new Date(item.dueDate) < now);

  const outstandingAmount = unpaid.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const overdueAmount = overdue.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const monthSeries = buildMonthSeries(12);
  const billedByMonth = new Map<string, number>();
  const paidByMonth = new Map<string, number>();
  for (const key of monthSeries.keys) {
    billedByMonth.set(key, 0);
    paidByMonth.set(key, 0);
  }

  for (const item of ledger) {
    const key = monthKey(new Date(item.dueDate));
    if (!billedByMonth.has(key)) continue;
    billedByMonth.set(key, (billedByMonth.get(key) ?? 0) + Number(item.amount || 0));
  }
  for (const item of payments) {
    const key = monthKey(new Date(item.paidAt));
    if (!paidByMonth.has(key)) continue;
    paidByMonth.set(key, (paidByMonth.get(key) ?? 0) + Number(item.amount || 0));
  }

  const billedTrend = monthSeries.keys.map((key) => round(billedByMonth.get(key) ?? 0, 0));
  const collectedTrend = monthSeries.keys.map((key) => round(paidByMonth.get(key) ?? 0, 0));

  const methodMap = new Map<string, number>();
  for (const p of payments) {
    const method = (p.method || 'UNKNOWN').toUpperCase();
    methodMap.set(method, (methodMap.get(method) ?? 0) + Number(p.amount || 0));
  }

  const methodMix = Array.from(methodMap.entries())
    .map(([method, amount]) => ({ method, amount: round(amount, 0), sharePct: pct(amount, totalPaid) }))
    .sort((a, b) => b.amount - a.amount);

  const paymentByStudent = new Map<string, number>();
  for (const p of payments) {
    paymentByStudent.set(p.studentId, (paymentByStudent.get(p.studentId) ?? 0) + Number(p.amount || 0));
  }

  const payerAmounts = Array.from(paymentByStudent.values()).sort((a, b) => b - a);
  const topCount = Math.max(1, Math.ceil(payerAmounts.length * 0.1));
  const topShare = pct(
    payerAmounts.slice(0, topCount).reduce((sum, v) => sum + v, 0),
    totalPaid
  );

  const outstandingByStudent = new Map<string, { outstanding: number; overdue: number; oldestDue?: Date }>();
  for (const row of unpaid) {
    const existing = outstandingByStudent.get(row.studentId) ?? { outstanding: 0, overdue: 0 };
    existing.outstanding += Number(row.amount || 0);
    const due = new Date(row.dueDate);
    if (due < now) {
      existing.overdue += Number(row.amount || 0);
      if (!existing.oldestDue || due < existing.oldestDue) {
        existing.oldestDue = due;
      }
    }
    outstandingByStudent.set(row.studentId, existing);
  }

  const riskTable = Array.from(outstandingByStudent.entries())
    .map(([studentId, row]) => ({
      studentId,
      studentName: studentNameMap.get(studentId) ?? studentId,
      outstanding: round(row.outstanding, 0),
      overdue: round(row.overdue, 0),
      overduePct: pct(row.overdue, row.outstanding),
      oldestDueDate: formatDate(row.oldestDue),
      riskScore: round(pct(row.overdue, row.outstanding) * 0.7 + pct(row.outstanding, Math.max(outstandingAmount, 1)) * 0.3, 2),
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  return {
    summary: {
      totalBilled: round(totalBilled, 0),
      totalPaid: round(totalPaid, 0),
      totalCredits: round(totalCredits, 0),
      collectionRatePct: pct(totalPaid, totalBilled),
      creditCoveragePct: pct(totalCredits, totalBilled),
      outstandingAmount: round(outstandingAmount, 0),
      overdueAmount: round(overdueAmount, 0),
      overdueRatePct: pct(overdueAmount, outstandingAmount),
      payerConcentrationTop10Pct: topShare,
      payerDistributionGini: gini(Array.from(paymentByStudent.values())),
    },
    trend: {
      labels: monthSeries.labels,
      billed: billedTrend,
      collected: collectedTrend,
      gap: billedTrend.map((value, idx) => round(value - (collectedTrend[idx] ?? 0), 0)),
    },
    methodMix,
    riskTable,
  };
}

export async function getAcademicEnterpriseAnalytics() {
  await connectDB();
  const scope = await resolveScope();

  const [sessions, attendance, coachingEnrollments, classMasters, sections, studentEnrollments] = await Promise.all([
    CoachingSessionModel.find(scope)
      .select('_id batchId facultyId sessionDate status')
      .lean<Array<{ _id: string; batchId: string; facultyId?: string; sessionDate: Date; status: string }>>(),
    CoachingAttendanceModel.find(scope)
      .select('sessionId batchId status markedAt')
      .lean<Array<{ sessionId: string; batchId: string; status: string; markedAt: Date }>>(),
    CoachingEnrollmentModel.find(scope)
      .select('batchId status studentId')
      .lean<Array<{ batchId: string; status: string; studentId: string }>>(),
    ClassMasterModel.find(scope).select('_id name').lean<Array<{ _id: string; name: string }>>(),
    SectionModel.find(scope)
      .select('_id classMasterId capacity')
      .lean<Array<{ _id: string; classMasterId: string; capacity?: number }>>(),
    StudentEnrollmentModel.find(scope)
      .select('classMasterId sectionId studentId')
      .lean<Array<{ classMasterId: string; sectionId: string; studentId: string }>>(),
  ]);

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
  const cancelledSessions = sessions.filter((s) => s.status === 'CANCELLED').length;

  const attendanceCounts = {
    PRESENT: 0,
    LATE: 0,
    ABSENT: 0,
  };
  for (const row of attendance) {
    const status = String(row.status).toUpperCase();
    if (status in attendanceCounts) {
      attendanceCounts[status as keyof typeof attendanceCounts] += 1;
    }
  }

  const totalAttendanceMarks = attendance.length;
  const attendanceQuality = pct(
    attendanceCounts.PRESENT + attendanceCounts.LATE * 0.5,
    Math.max(totalAttendanceMarks, 1)
  );

  const activeEnrollmentByBatch = new Map<string, number>();
  for (const item of coachingEnrollments) {
    if (String(item.status).toUpperCase() !== 'ACTIVE') continue;
    activeEnrollmentByBatch.set(item.batchId, (activeEnrollmentByBatch.get(item.batchId) ?? 0) + 1);
  }

  const completedSessionsByBatch = new Map<string, number>();
  const completedSessionIds = new Set<string>();
  for (const session of sessions) {
    if (String(session.status).toUpperCase() !== 'COMPLETED') continue;
    completedSessionsByBatch.set(session.batchId, (completedSessionsByBatch.get(session.batchId) ?? 0) + 1);
    completedSessionIds.add(session._id);
  }

  const expectedAttendance = Array.from(completedSessionsByBatch.entries()).reduce((sum, [batchId, count]) => {
    return sum + count * (activeEnrollmentByBatch.get(batchId) ?? 0);
  }, 0);

  const recordedCompletedAttendance = attendance.filter((row) => completedSessionIds.has(row.sessionId)).length;

  const enrollmentsByClass = new Map<string, number>();
  const enrollmentsBySection = new Map<string, number>();
  for (const item of studentEnrollments) {
    enrollmentsByClass.set(item.classMasterId, (enrollmentsByClass.get(item.classMasterId) ?? 0) + 1);
    enrollmentsBySection.set(item.sectionId, (enrollmentsBySection.get(item.sectionId) ?? 0) + 1);
  }

  const totalKnownCapacity = sections.reduce((sum, sec) => sum + Math.max(0, Number(sec.capacity || 0)), 0);
  const totalStudents = studentEnrollments.length;

  const batchMetrics = new Map<
    string,
    {
      batchId: string;
      activeStudents: number;
      completedSessions: number;
      marked: number;
      present: number;
      late: number;
      absent: number;
    }
  >();

  for (const [batchId, count] of activeEnrollmentByBatch.entries()) {
    batchMetrics.set(batchId, {
      batchId,
      activeStudents: count,
      completedSessions: completedSessionsByBatch.get(batchId) ?? 0,
      marked: 0,
      present: 0,
      late: 0,
      absent: 0,
    });
  }

  for (const row of attendance) {
    const entry = batchMetrics.get(row.batchId) ?? {
      batchId: row.batchId,
      activeStudents: activeEnrollmentByBatch.get(row.batchId) ?? 0,
      completedSessions: completedSessionsByBatch.get(row.batchId) ?? 0,
      marked: 0,
      present: 0,
      late: 0,
      absent: 0,
    };

    entry.marked += 1;
    const status = String(row.status).toUpperCase();
    if (status === 'PRESENT') entry.present += 1;
    if (status === 'LATE') entry.late += 1;
    if (status === 'ABSENT') entry.absent += 1;
    batchMetrics.set(row.batchId, entry);
  }

  const batchRiskTable = Array.from(batchMetrics.values())
    .map((row) => {
      const expected = row.activeStudents * row.completedSessions;
      const coverage = pct(row.marked, expected);
      const absenceRate = pct(row.absent, row.marked);
      const riskScore = round(absenceRate * 0.6 + (100 - coverage) * 0.4, 2);
      return {
        batchId: row.batchId,
        activeStudents: row.activeStudents,
        completedSessions: row.completedSessions,
        attendanceCoveragePct: coverage,
        absenceRatePct: absenceRate,
        riskScore,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  const monthSeries = buildMonthSeries(12);
  const completedSessionsByMonth = new Map<string, number>();
  const attendanceQualityByMonth = new Map<string, { weighted: number; total: number }>();
  for (const key of monthSeries.keys) {
    completedSessionsByMonth.set(key, 0);
    attendanceQualityByMonth.set(key, { weighted: 0, total: 0 });
  }

  for (const row of sessions) {
    if (String(row.status).toUpperCase() !== 'COMPLETED') continue;
    const key = monthKey(new Date(row.sessionDate));
    if (!completedSessionsByMonth.has(key)) continue;
    completedSessionsByMonth.set(key, (completedSessionsByMonth.get(key) ?? 0) + 1);
  }

  for (const row of attendance) {
    const key = monthKey(new Date(row.markedAt));
    const agg = attendanceQualityByMonth.get(key);
    if (!agg) continue;
    const status = String(row.status).toUpperCase();
    const weight = status === 'PRESENT' ? 1 : status === 'LATE' ? 0.5 : 0;
    agg.weighted += weight;
    agg.total += 1;
    attendanceQualityByMonth.set(key, agg);
  }

  const classUtilizationTable = classMasters
    .map((cls) => {
      const classSectionIds = sections.filter((s) => s.classMasterId === cls._id).map((s) => s._id);
      const classCapacity = sections
        .filter((s) => s.classMasterId === cls._id)
        .reduce((sum, sec) => sum + Math.max(0, Number(sec.capacity || 0)), 0);
      const studentsInClass = enrollmentsByClass.get(cls._id) ?? 0;
      const sectionsInClass = classSectionIds.length;

      return {
        classId: cls._id,
        className: cls.name,
        sections: sectionsInClass,
        students: studentsInClass,
        avgStudentsPerSection: safeRatio(studentsInClass, Math.max(sectionsInClass, 1)),
        knownCapacity: classCapacity,
        utilizationPct: classCapacity > 0 ? pct(studentsInClass, classCapacity) : 0,
      };
    })
    .sort((a, b) => b.utilizationPct - a.utilizationPct)
    .slice(0, 10);

  return {
    summary: {
      totalSessions,
      completedSessions,
      cancelledSessions,
      sessionCompletionRatePct: pct(completedSessions, totalSessions),
      attendanceMarks: totalAttendanceMarks,
      presentRatePct: pct(attendanceCounts.PRESENT, totalAttendanceMarks),
      lateRatePct: pct(attendanceCounts.LATE, totalAttendanceMarks),
      absentRatePct: pct(attendanceCounts.ABSENT, totalAttendanceMarks),
      attendanceQualityPct: attendanceQuality,
      attendanceCoveragePct: pct(recordedCompletedAttendance, expectedAttendance),
      totalStudents,
      sectionSeatUtilizationPct: totalKnownCapacity > 0 ? pct(totalStudents, totalKnownCapacity) : 0,
    },
    trend: {
      labels: monthSeries.labels,
      completedSessions: monthSeries.keys.map((key) => completedSessionsByMonth.get(key) ?? 0),
      attendanceQualityPct: monthSeries.keys.map((key) => {
        const agg = attendanceQualityByMonth.get(key) ?? { weighted: 0, total: 0 };
        return pct(agg.weighted, agg.total);
      }),
    },
    classUtilizationTable,
    batchRiskTable,
  };
}

export async function getClassesEnterpriseAnalytics() {
  await connectDB();
  const scope = await resolveScope();

  const [classes, sections, enrollments, teachers] = await Promise.all([
    ClassMasterModel.find(scope)
      .select('_id name level')
      .lean<Array<{ _id: string; name: string; level?: string }>>(),
    SectionModel.find(scope)
      .select('_id classMasterId name capacity classTeacherId')
      .lean<
        Array<{
          _id: string;
          classMasterId: string;
          name: string;
          capacity?: number;
          classTeacherId?: string;
        }>
      >(),
    StudentEnrollmentModel.find(scope)
      .select('classMasterId sectionId studentId')
      .lean<Array<{ classMasterId: string; sectionId: string; studentId: string }>>(),
    UserModel.find({ ...scope, role: UserRole.TEACHER })
      .select('_id')
      .lean<Array<{ _id: string }>>(),
  ]);

  const sectionCountByClass = new Map<string, number>();
  const teacherSectionCountByClass = new Map<string, number>();
  const capacityByClass = new Map<string, number>();
  for (const section of sections) {
    sectionCountByClass.set(section.classMasterId, (sectionCountByClass.get(section.classMasterId) ?? 0) + 1);
    if (section.classTeacherId) {
      teacherSectionCountByClass.set(
        section.classMasterId,
        (teacherSectionCountByClass.get(section.classMasterId) ?? 0) + 1
      );
    }
    capacityByClass.set(
      section.classMasterId,
      (capacityByClass.get(section.classMasterId) ?? 0) + Math.max(0, Number(section.capacity || 0))
    );
  }

  const enrollmentCountByClass = new Map<string, number>();
  const enrollmentCountBySection = new Map<string, number>();
  for (const enrollment of enrollments) {
    enrollmentCountByClass.set(
      enrollment.classMasterId,
      (enrollmentCountByClass.get(enrollment.classMasterId) ?? 0) + 1
    );
    enrollmentCountBySection.set(
      enrollment.sectionId,
      (enrollmentCountBySection.get(enrollment.sectionId) ?? 0) + 1
    );
  }

  const sectionHotspots = sections
    .map((section) => {
      const students = enrollmentCountBySection.get(section._id) ?? 0;
      const cap = Math.max(0, Number(section.capacity || 0));
      const utilization = cap > 0 ? pct(students, cap) : 0;
      return {
        sectionId: section._id,
        classMasterId: section.classMasterId,
        sectionName: section.name,
        students,
        capacity: cap,
        utilizationPct: utilization,
      };
    })
    .sort((a, b) => b.utilizationPct - a.utilizationPct)
    .slice(0, 10);

  const classRows = classes
    .map((cls) => {
      const sectionsInClass = sectionCountByClass.get(cls._id) ?? 0;
      const teacherMappedSections = teacherSectionCountByClass.get(cls._id) ?? 0;
      const students = enrollmentCountByClass.get(cls._id) ?? 0;
      const knownCapacity = capacityByClass.get(cls._id) ?? 0;
      const avgStudentsPerSection = safeRatio(students, Math.max(sectionsInClass, 1));

      return {
        id: cls._id,
        className: cls.name,
        level: cls.level || '-',
        sections: sectionsInClass,
        students,
        teacherCoveragePct: pct(teacherMappedSections, Math.max(sectionsInClass, 1)),
        knownCapacity,
        seatUtilizationPct: knownCapacity > 0 ? pct(students, knownCapacity) : 0,
        avgStudentsPerSection,
      };
    })
    .sort((a, b) => b.students - a.students);

  const totalClasses = classes.length;
  const totalSections = sections.length;
  const totalEnrollments = enrollments.length;
  const totalTeacherCount = teachers.length;
  const sectionlessClasses = classRows.filter((row) => row.sections === 0).length;
  const overloadedSections = sectionHotspots.filter((row) => row.capacity > 0 && row.utilizationPct > 100).length;

  const sortedEnrollments = classRows.map((row) => row.students).sort((a, b) => b - a);
  const top20Count = Math.max(1, Math.ceil(sortedEnrollments.length * 0.2));
  const top20Share = pct(
    sortedEnrollments.slice(0, top20Count).reduce((sum, value) => sum + value, 0),
    totalEnrollments
  );

  return {
    summary: {
      totalClasses,
      totalSections,
      totalEnrollments,
      totalTeacherCount,
      studentsPerSection: safeRatio(totalEnrollments, Math.max(totalSections, 1)),
      studentsPerTeacher: safeRatio(totalEnrollments, Math.max(totalTeacherCount, 1)),
      sectionlessClasses,
      overloadedSections,
      enrollmentConcentrationTop20Pct: top20Share,
      enrollmentDistributionGini: gini(classRows.map((row) => row.students)),
    },
    classRows: classRows.slice(0, 20),
    sectionHotspots,
  };
}
