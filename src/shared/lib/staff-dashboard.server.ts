import { User, UserRole } from '@/domains/user-management/domain/entities/User';
import { StudentFeeLedgerModel, PaymentModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { connectDB } from '@/shared/infrastructure/database';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

type LedgerDoc = {
  _id: string;
  studentId: string;
  amount: number;
  dueDate: Date;
  status: string;
};

type PaymentDoc = {
  _id: string;
  studentId: string;
  amount: number;
  paidAt: Date;
  method: string;
};

export type StaffDashboardPayload = {
  summary: {
    pendingRequests: number;
    completedToday: number;
    highPriority: number;
    scheduledBlocks: number;
  };
  requests: Array<{
    id: string;
    title: string;
    requester: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'completed';
  }>;
  schedule: Array<{
    id: string;
    title: string;
    time: string;
    owner: string;
  }>;
};

export async function getStaffDashboardData(actor: User): Promise<StaffDashboardPayload> {
  if (actor.getRole() !== UserRole.STAFF) {
    throw new Error('FORBIDDEN');
  }

  const organizationId = actor.getOrganizationId();
  const coachingCenterId = actor.getCoachingCenterId();
  if (!organizationId || !coachingCenterId) {
    return {
      summary: { pendingRequests: 0, completedToday: 0, highPriority: 0, scheduledBlocks: 0 },
      requests: [],
      schedule: [],
    };
  }

  await connectDB();

  const todayStart = startOfDay(new Date());

  const [dueLedgers, paymentsToday, recentPayments] = await Promise.all([
    StudentFeeLedgerModel.find({
      organizationId,
      coachingCenterId,
      status: { $ne: 'PAID' },
    })
      .sort({ dueDate: 1 })
      .limit(8)
      .lean<Array<LedgerDoc>>(),
    PaymentModel.countDocuments({
      organizationId,
      coachingCenterId,
      paidAt: { $gte: todayStart },
    }),
    PaymentModel.find({ organizationId, coachingCenterId })
      .sort({ paidAt: -1 })
      .limit(4)
      .lean<Array<PaymentDoc>>(),
  ]);

  const studentIds = Array.from(
    new Set([...dueLedgers.map((item) => item.studentId), ...recentPayments.map((item) => item.studentId)])
  );

  const students =
    studentIds.length > 0
      ? await UserModel.find({ _id: { $in: studentIds } })
          .select('_id firstName lastName')
          .lean<Array<{ _id: string; firstName: string; lastName: string }>>()
      : [];

  const studentNameMap = new Map(
    students.map((item) => [item._id, `${item.firstName} ${item.lastName}`.trim() || item._id])
  );

  const highPriority = dueLedgers.filter(
    (item) => item.status.toUpperCase() === 'OVERDUE' || new Date(item.dueDate) < todayStart
  ).length;

  const requests = dueLedgers.map((item) => {
    const isOverdue = item.status.toUpperCase() === 'OVERDUE' || new Date(item.dueDate) < todayStart;
    return {
      id: item._id,
      title: `Fee follow-up for ${studentNameMap.get(item.studentId) ?? item.studentId}`,
      requester: 'Finance Queue',
      priority: isOverdue ? 'high' : 'medium',
      status: isOverdue ? 'in-progress' : 'pending',
    };
  });

  const schedule = recentPayments.map((item) => ({
    id: item._id,
    title: `Payment received · INR ${item.amount.toLocaleString()}`,
    time: new Date(item.paidAt).toLocaleString(),
    owner: studentNameMap.get(item.studentId) ?? item.studentId,
  }));

  return {
    summary: {
      pendingRequests: dueLedgers.length,
      completedToday: paymentsToday,
      highPriority,
      scheduledBlocks: schedule.length,
    },
    requests,
    schedule,
  };
}
