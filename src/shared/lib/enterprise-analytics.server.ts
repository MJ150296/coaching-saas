import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { connectDB } from '@/shared/infrastructure/database';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import {
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
  CoachingProgramModel,
  CoachingBatchModel,
} from '@/domains/coaching-management/infrastructure/persistence/CoachingSchema';
import { getOrSetCachedValue } from '@/shared/infrastructure/api-response-cache';

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

type DateRange = {
  from?: Date;
  to?: Date;
};

function round(value: number, places = 2): number {
  const p = 10 ** places;
  return Math.round(value * p) / p;
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return round((part / total) * 100, 2);
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

function buildMonthSeries(months = 12, anchor?: Date): MonthSeries {
  const now = anchor ?? new Date();
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

function normalizeRange(range?: DateRange): DateRange | undefined {
  if (!range) return undefined;
  const from = range.from ? new Date(range.from) : undefined;
  const to = range.to ? new Date(range.to) : undefined;
  if (from) from.setHours(0, 0, 0, 0);
  if (to) to.setHours(23, 59, 59, 999);
  if (from && to && from > to) return undefined;
  if (!from && !to) return undefined;
  return { from, to };
}

function buildDateQuery(field: string, range?: DateRange) {
  if (!range) return undefined;
  const query: Record<string, Date> = {};
  if (range.from) query.$gte = range.from;
  if (range.to) query.$lte = range.to;
  return Object.keys(query).length ? { [field]: query } : undefined;
}

function buildMonthSeriesForRange(range?: DateRange, fallbackMonths = 12): MonthSeries {
  if (!range?.from || !range?.to) return buildMonthSeries(fallbackMonths);
  const from = new Date(range.from.getFullYear(), range.from.getMonth(), 1);
  const to = new Date(range.to.getFullYear(), range.to.getMonth(), 1);
  const months = Math.max(
    1,
    Math.min(
      fallbackMonths,
      (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1
    )
  );
  return buildMonthSeries(months, to);
}

const ENTERPRISE_ANALYTICS_CACHE_TTL_MS = 60_000;

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

export async function getUsersEnterpriseAnalytics(range?: DateRange) {
  await connectDB();
  const scope = await resolveScope();
  const normalizedRange = normalizeRange(range);
  const rangeKey = `${normalizedRange?.from?.toISOString() ?? 'na'}:${normalizedRange?.to?.toISOString() ?? 'na'}`;
  const cacheKey = `analytics:users:${scope.organizationId ?? 'all'}:${scope.coachingCenterId ?? 'all'}:${rangeKey}`;

  return getOrSetCachedValue(cacheKey, ENTERPRISE_ANALYTICS_CACHE_TTL_MS, async () => {
    const createdAtQuery = buildDateQuery('createdAt', normalizedRange);

    const users = await UserModel.find({ ...scope, ...(createdAtQuery ?? {}) })
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

  const monthSeries = buildMonthSeriesForRange(normalizedRange, 12);
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
  });
}

export async function getFeesEnterpriseAnalytics(range?: DateRange) {
  await connectDB();
  const scope = await resolveScope();
  const normalizedRange = normalizeRange(range);
  const rangeKey = `${normalizedRange?.from?.toISOString() ?? 'na'}:${normalizedRange?.to?.toISOString() ?? 'na'}`;
  const cacheKey = `analytics:fees:${scope.organizationId ?? 'all'}:${scope.coachingCenterId ?? 'all'}:${rangeKey}`;

  return getOrSetCachedValue(cacheKey, ENTERPRISE_ANALYTICS_CACHE_TTL_MS, async () => {
    const ledgerDateQuery = buildDateQuery('dueDate', normalizedRange);
    const paymentDateQuery = buildDateQuery('paidAt', normalizedRange);
    const creditDateQuery = buildDateQuery('createdOn', normalizedRange);

    const [ledger, payments, credits, students] = await Promise.all([
      StudentFeeLedgerModel.find({ ...scope, ...(ledgerDateQuery ?? {}) })
        .select('studentId amount dueDate status')
        .lean<Array<{ studentId: string; amount: number; dueDate: Date; status: string }>>(),
      PaymentModel.find({ ...scope, ...(paymentDateQuery ?? {}) })
        .select('studentId amount paidAt method')
        .lean<Array<{ studentId: string; amount: number; paidAt: Date; method: string }>>(),
      CreditNoteModel.find({ ...scope, ...(creditDateQuery ?? {}) })
        .select('studentId amount createdOn')
        .lean<Array<{ studentId: string; amount: number; createdOn: Date }>>(),
      UserModel.find({ ...scope, role: UserRole.STUDENT })
        .select('_id firstName lastName email')
        .lean<Array<{ _id: string; firstName?: string; lastName?: string; email: string }>>(),
    ]);

  const studentNameMap = new Map<string, string>();
  const studentEmailMap = new Map<string, string>();
  for (const student of students) {
    const name = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.email;
    studentNameMap.set(student._id, name);
    studentEmailMap.set(student._id, student.email);
  }

  const totalBilled = ledger.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalCredits = credits.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const now = new Date();
  const unpaid = ledger.filter((item) => String(item.status).toUpperCase() !== 'PAID');
  const overdue = unpaid.filter((item) => new Date(item.dueDate) < now);

  const outstandingAmount = unpaid.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const overdueAmount = overdue.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const monthSeries = buildMonthSeriesForRange(normalizedRange, 12);
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
      studentEmail: studentEmailMap.get(studentId) ?? '',
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
  });
}

export async function getAcademicEnterpriseAnalytics(range?: DateRange) {
  await connectDB();
  const scope = await resolveScope();
  const normalizedRange = normalizeRange(range);
  const rangeKey = `${normalizedRange?.from?.toISOString() ?? 'na'}:${normalizedRange?.to?.toISOString() ?? 'na'}`;
  const cacheKey = `analytics:academic:${scope.organizationId ?? 'all'}:${scope.coachingCenterId ?? 'all'}:${rangeKey}`;

  return getOrSetCachedValue(cacheKey, ENTERPRISE_ANALYTICS_CACHE_TTL_MS, async () => {
    const sessionDateQuery = buildDateQuery('sessionDate', normalizedRange);
    const attendanceDateQuery = buildDateQuery('markedAt', normalizedRange);

    const [sessions, attendance, coachingEnrollments, studentEnrollments] = await Promise.all([
      CoachingSessionModel.find({ ...scope, ...(sessionDateQuery ?? {}) })
        .select('_id batchId facultyId sessionDate status topic')
        .lean<Array<{ _id: string; batchId: string; facultyId?: string; sessionDate: Date; status: string; topic?: string }>>(),
      CoachingAttendanceModel.find({ ...scope, ...(attendanceDateQuery ?? {}) })
        .select('sessionId batchId status markedAt')
        .lean<Array<{ sessionId: string; batchId: string; status: string; markedAt: Date }>>(),
      CoachingEnrollmentModel.find(scope)
        .select('batchId status studentId')
        .lean<Array<{ batchId: string; status: string; studentId: string }>>(),
      StudentEnrollmentModel.find(scope)
        .select('programId batchId studentId')
        .lean<Array<{ programId: string; batchId?: string; studentId: string }>>(),
    ]);

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
  const cancelledSessions = sessions.filter((s) => s.status === 'CANCELLED').length;

  const attendanceCounts = {
    PRESENT: 0,
    LATE: 0,
    ABSENT: 0,
  };
  const attendanceBySession = new Map<
    string,
    { marked: number; present: number; late: number; absent: number }
  >();
  for (const row of attendance) {
    const status = String(row.status).toUpperCase();
    if (status in attendanceCounts) {
      attendanceCounts[status as keyof typeof attendanceCounts] += 1;
    }
    const entry = attendanceBySession.get(row.sessionId) ?? {
      marked: 0,
      present: 0,
      late: 0,
      absent: 0,
    };
    entry.marked += 1;
    if (status === 'PRESENT') entry.present += 1;
    if (status === 'LATE') entry.late += 1;
    if (status === 'ABSENT') entry.absent += 1;
    attendanceBySession.set(row.sessionId, entry);
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

  const monthSeries = buildMonthSeriesForRange(normalizedRange, 12);
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

  const recentSessions = sessions
    .slice()
    .sort((a, b) => +new Date(b.sessionDate) - +new Date(a.sessionDate))
    .slice(0, 10)
    .map((session) => {
      const counts = attendanceBySession.get(session._id) ?? {
        marked: 0,
        present: 0,
        late: 0,
        absent: 0,
      };
      return {
        sessionId: session._id,
        topic: session.topic,
        batchId: session.batchId,
        sessionDate: formatDate(session.sessionDate),
        status: session.status,
        marked: counts.marked,
        present: counts.present,
        late: counts.late,
        absent: counts.absent,
      };
    });

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
      },
      trend: {
        labels: monthSeries.labels,
        completedSessions: monthSeries.keys.map((key) => completedSessionsByMonth.get(key) ?? 0),
        attendanceQualityPct: monthSeries.keys.map((key) => {
          const agg = attendanceQualityByMonth.get(key) ?? { weighted: 0, total: 0 };
          return pct(agg.weighted, agg.total);
        }),
      },
      recentSessions,
      batchRiskTable,
    };
  });
}

export async function getProgramsBatchesEnterpriseAnalytics(range?: DateRange) {
  await connectDB();
  const scope = await resolveScope();
  const normalizedRange = normalizeRange(range);
  const rangeKey = `${normalizedRange?.from?.toISOString() ?? 'na'}:${normalizedRange?.to?.toISOString() ?? 'na'}`;
  const cacheKey = `analytics:programs-batches:${scope.organizationId ?? 'all'}:${scope.coachingCenterId ?? 'all'}:${rangeKey}`;

  return getOrSetCachedValue(cacheKey, ENTERPRISE_ANALYTICS_CACHE_TTL_MS, async () => {
    const programDateQuery = buildDateQuery('createdAt', normalizedRange);
    const batchDateQuery = buildDateQuery('createdAt', normalizedRange);
    const enrollmentDateQuery = buildDateQuery('enrolledOn', normalizedRange);
    const sessionDateQuery = buildDateQuery('sessionDate', normalizedRange);
    const attendanceDateQuery = buildDateQuery('markedAt', normalizedRange);

    const [programs, batches, enrollments, sessions, attendance, users] = await Promise.all([
      CoachingProgramModel.find({ ...scope, ...(programDateQuery ?? {}) })
        .select('_id name code classLevel board status')
        .lean<Array<{ _id: string; name: string; code?: string; classLevel?: string; board?: string; status: string }>>(),
      CoachingBatchModel.find({ ...scope, ...(batchDateQuery ?? {}) })
        .select('_id programId name facultyId capacity isActive startsOn endsOn')
        .lean<Array<{ _id: string; programId: string; name: string; facultyId?: string; capacity: number; isActive: boolean; startsOn?: Date; endsOn?: Date }>>(),
      CoachingEnrollmentModel.find({ ...scope, ...(enrollmentDateQuery ?? {}) })
        .select('programId batchId studentId status enrolledOn')
        .lean<Array<{ programId: string; batchId: string; studentId: string; status: string; enrolledOn: Date }>>(),
      CoachingSessionModel.find({ ...scope, ...(sessionDateQuery ?? {}) })
        .select('programId batchId status sessionDate')
        .lean<Array<{ programId: string; batchId: string; status: string; sessionDate: Date }>>(),
      CoachingAttendanceModel.find({ ...scope, ...(attendanceDateQuery ?? {}) })
        .select('programId batchId sessionId status markedAt')
        .lean<Array<{ programId: string; batchId: string; sessionId: string; status: string; markedAt: Date }>>(),
      UserModel.find({ ...scope, role: UserRole.TEACHER })
        .select('_id firstName lastName email')
        .lean<Array<{ _id: string; firstName?: string; lastName?: string; email: string }>>(),
    ]);

    const teacherNameMap = new Map<string, string>();
    for (const teacher of users) {
      const name = `${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim() || teacher.email;
      teacherNameMap.set(teacher._id, name);
    }

    // Program-level aggregations
    const programStats = new Map<string, {
      programId: string;
      name: string;
      code?: string;
      classLevel?: string;
      board?: string;
      status: string;
      batches: number;
      activeEnrollments: number;
      totalEnrollments: number;
      completedSessions: number;
      totalSessions: number;
    }>();

    for (const program of programs) {
      programStats.set(program._id, {
        programId: program._id,
        name: program.name,
        code: program.code,
        classLevel: program.classLevel,
        board: program.board,
        status: program.status,
        batches: 0,
        activeEnrollments: 0,
        totalEnrollments: 0,
        completedSessions: 0,
        totalSessions: 0,
      });
    }

    for (const batch of batches) {
      const stats = programStats.get(batch.programId);
      if (stats) stats.batches += 1;
    }

    for (const enrollment of enrollments) {
      const stats = programStats.get(enrollment.programId);
      if (stats) {
        stats.totalEnrollments += 1;
        if (enrollment.status === 'ACTIVE') stats.activeEnrollments += 1;
      }
    }

    for (const session of sessions) {
      const stats = programStats.get(session.programId);
      if (stats) {
        stats.totalSessions += 1;
        if (session.status === 'COMPLETED') stats.completedSessions += 1;
      }
    }

    // Batch-level aggregations
    const batchStats = new Map<string, {
      batchId: string;
      programId: string;
      name: string;
      facultyId?: string;
      capacity: number;
      isActive: boolean;
      activeEnrollments: number;
      totalEnrollments: number;
      completedSessions: number;
      totalSessions: number;
      attendanceMarks: number;
      presentMarks: number;
      lateMarks: number;
      absentMarks: number;
    }>();

    for (const batch of batches) {
      batchStats.set(batch._id, {
        batchId: batch._id,
        programId: batch.programId,
        name: batch.name,
        facultyId: batch.facultyId,
        capacity: batch.capacity,
        isActive: batch.isActive,
        activeEnrollments: 0,
        totalEnrollments: 0,
        completedSessions: 0,
        totalSessions: 0,
        attendanceMarks: 0,
        presentMarks: 0,
        lateMarks: 0,
        absentMarks: 0,
      });
    }

    for (const enrollment of enrollments) {
      const stats = batchStats.get(enrollment.batchId);
      if (stats) {
        stats.totalEnrollments += 1;
        if (enrollment.status === 'ACTIVE') stats.activeEnrollments += 1;
      }
    }

    for (const session of sessions) {
      const stats = batchStats.get(session.batchId);
      if (stats) {
        stats.totalSessions += 1;
        if (session.status === 'COMPLETED') stats.completedSessions += 1;
      }
    }

    for (const att of attendance) {
      const stats = batchStats.get(att.batchId);
      if (stats) {
        stats.attendanceMarks += 1;
        const status = String(att.status).toUpperCase();
        if (status === 'PRESENT') stats.presentMarks += 1;
        else if (status === 'LATE') stats.lateMarks += 1;
        else if (status === 'ABSENT') stats.absentMarks += 1;
      }
    }

    // Monthly trend
    const monthSeries = buildMonthSeriesForRange(normalizedRange, 12);
    const enrollmentsByMonth = new Map<string, number>();
    const sessionsByMonth = new Map<string, number>();
    for (const key of monthSeries.keys) {
      enrollmentsByMonth.set(key, 0);
      sessionsByMonth.set(key, 0);
    }

    for (const enrollment of enrollments) {
      const key = monthKey(new Date(enrollment.enrolledOn));
      if (!enrollmentsByMonth.has(key)) continue;
      enrollmentsByMonth.set(key, (enrollmentsByMonth.get(key) ?? 0) + 1);
    }

    for (const session of sessions) {
      const key = monthKey(new Date(session.sessionDate));
      if (!sessionsByMonth.has(key)) continue;
      sessionsByMonth.set(key, (sessionsByMonth.get(key) ?? 0) + 1);
    }

    // Program rows for table
    const programRows = Array.from(programStats.values())
      .map((row) => ({
        ...row,
        sessionCompletionRatePct: pct(row.completedSessions, row.totalSessions),
        enrollmentUtilizationPct: row.batches > 0 ? pct(row.activeEnrollments, row.batches * 30) : 0,
      }))
      .sort((a, b) => b.activeEnrollments - a.activeEnrollments);

    // Batch rows for table
    const batchRows = Array.from(batchStats.values())
      .map((row) => {
        const expected = row.activeEnrollments * row.completedSessions;
        const coverage = pct(row.attendanceMarks, expected);
        const quality = pct(row.presentMarks + row.lateMarks * 0.5, row.attendanceMarks);
        const utilization = row.capacity > 0 ? pct(row.activeEnrollments, row.capacity) : 0;
        const riskScore = round(
          (100 - quality) * 0.4 + (100 - coverage) * 0.3 + Math.max(0, utilization - 100) * 0.3,
          2
        );
        return {
          ...row,
          facultyName: row.facultyId ? teacherNameMap.get(row.facultyId) ?? '-' : '-',
          attendanceCoveragePct: coverage,
          attendanceQualityPct: quality,
          seatUtilizationPct: utilization,
          riskScore,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    // Summary calculations
    const totalPrograms = programs.length;
    const totalBatches = batches.length;
    const activePrograms = programs.filter((p) => p.status === 'ACTIVE').length;
    const activeBatches = batches.filter((b) => b.isActive).length;
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE').length;
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const totalAttendanceMarks = attendance.length;
    const presentMarks = attendance.filter((a) => String(a.status).toUpperCase() === 'PRESENT').length;
    const totalCapacity = batches.reduce((sum, b) => sum + b.capacity, 0);

    const overloadedBatches = batchRows.filter((r) => r.capacity > 0 && r.seatUtilizationPct > 100).length;
    const facultyLessBatches = batches.filter((b) => !b.facultyId).length;

    return {
      summary: {
        totalPrograms,
        activePrograms,
        totalBatches,
        activeBatches,
        totalEnrollments,
        activeEnrollments,
        totalSessions,
        completedSessions,
        sessionCompletionRatePct: pct(completedSessions, totalSessions),
        attendanceQualityPct: pct(presentMarks, totalAttendanceMarks),
        seatUtilizationPct: pct(activeEnrollments, totalCapacity),
        overloadedBatches,
        facultyLessBatches,
      },
      trend: {
        labels: monthSeries.labels,
        enrollments: monthSeries.keys.map((key) => enrollmentsByMonth.get(key) ?? 0),
        sessions: monthSeries.keys.map((key) => sessionsByMonth.get(key) ?? 0),
      },
      programRows: programRows.slice(0, 20),
      batchRows: batchRows.slice(0, 20),
    };
  });
}
