import { User, UserRole } from '@/domains/user-management/domain/entities/User';
import { StudentEnrollmentModel } from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import { CoachingProgramModel, CoachingBatchModel } from '@/domains/coaching-management/infrastructure/persistence/CoachingSchema';
import { StudentFeeLedgerModel, PaymentModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';
import { ParentStudentLinkModel } from '@/domains/user-management/infrastructure/persistence/ParentStudentLinkSchema';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { connectDB } from '@/shared/infrastructure/database';

type LinkedStudent = {
  _id: string;
  firstName: string;
  lastName: string;
};

type EnrollmentDoc = {
  studentId: string;
  programId: string;
  batchId: string;
  createdAt: Date;
};

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

export type ParentDashboardPayload = {
  summary: {
    childCount: number;
    pendingFees: number;
    activeEnrollments: number;
    overdueItems: number;
  };
  children: Array<{
    id: string;
    name: string;
    programLabel: string;
    attendance: number;
    pendingFees: number;
  }>;
  notices: Array<{
    id: string;
    title: string;
    date: string;
    category: 'academic' | 'fees' | 'general';
  }>;
  homework: Array<{
    id: string;
    childName: string;
    subject: string;
    dueDate: string;
    status: 'assigned' | 'submitted' | 'overdue';
  }>;
};

export async function getParentDashboardData(actor: User): Promise<ParentDashboardPayload> {
  if (actor.getRole() !== UserRole.PARENT) {
    throw new Error('FORBIDDEN');
  }

  await connectDB();

  const linkQuery: Record<string, unknown> = { parentId: actor.getId() };
  if (actor.getOrganizationId()) linkQuery.organizationId = actor.getOrganizationId();
  if (actor.getCoachingCenterId()) linkQuery.coachingCenterId = actor.getCoachingCenterId();

  const links = await ParentStudentLinkModel.find(linkQuery)
    .lean<Array<{ studentId: string }>>();

  const studentIds = Array.from(new Set(links.map((item) => item.studentId)));
  if (studentIds.length === 0) {
    return {
      summary: { childCount: 0, pendingFees: 0, activeEnrollments: 0, overdueItems: 0 },
      children: [],
      notices: [],
      homework: [],
    };
  }

  const [students, enrollmentsRaw, ledgers, payments] = await Promise.all([
    UserModel.find({ _id: { $in: studentIds }, role: UserRole.STUDENT })
      .select('_id firstName lastName')
      .lean<Array<LinkedStudent>>(),
    StudentEnrollmentModel.find({ studentId: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .lean<Array<EnrollmentDoc>>(),
    StudentFeeLedgerModel.find({ studentId: { $in: studentIds }, status: { $ne: 'PAID' } })
      .sort({ dueDate: 1 })
      .lean<Array<LedgerDoc>>(),
    PaymentModel.find({ studentId: { $in: studentIds } })
      .sort({ paidAt: -1 })
      .limit(6)
      .lean<Array<PaymentDoc>>(),
  ]);

  const latestEnrollmentByStudent = new Map<string, EnrollmentDoc>();
  for (const enrollment of enrollmentsRaw) {
    if (!latestEnrollmentByStudent.has(enrollment.studentId)) {
      latestEnrollmentByStudent.set(enrollment.studentId, enrollment);
    }
  }

  const programIds = Array.from(new Set(Array.from(latestEnrollmentByStudent.values()).map((item) => item.programId)));
  const batchIds = Array.from(new Set(Array.from(latestEnrollmentByStudent.values()).map((item) => item.batchId)));

  const [programs, batches] = await Promise.all([
    programIds.length > 0
      ? CoachingProgramModel.find({ _id: { $in: programIds } }).lean<Array<{ _id: string; name: string }>>()
      : Promise.resolve([]),
    batchIds.length > 0
      ? CoachingBatchModel.find({ _id: { $in: batchIds } }).lean<Array<{ _id: string; name: string }>>()
      : Promise.resolve([]),
  ]);

  const programMap = new Map(programs.map((item) => [item._id, item.name]));
  const batchMap = new Map(batches.map((item) => [item._id, item.name]));
  const studentMap = new Map(students.map((item) => [item._id, `${item.firstName} ${item.lastName}`.trim()]));

  const pendingFeeByStudent = new Map<string, number>();
  let overdueItems = 0;
  for (const ledger of ledgers) {
    pendingFeeByStudent.set(ledger.studentId, (pendingFeeByStudent.get(ledger.studentId) ?? 0) + Number(ledger.amount || 0));
    const isOverdue = ledger.status.toUpperCase() === 'OVERDUE' || new Date(ledger.dueDate) < new Date();
    if (isOverdue) overdueItems += 1;
  }

  const children = studentIds.map((studentId) => {
    const enrollment = latestEnrollmentByStudent.get(studentId);
    const programName = enrollment ? programMap.get(enrollment.programId) ?? enrollment.programId : 'Not Enrolled';
    const batchName = enrollment ? batchMap.get(enrollment.batchId) ?? enrollment.batchId : '';
    const programLabel = batchName ? `${programName} - ${batchName}` : programName;

    return {
      id: studentId,
      name: studentMap.get(studentId) ?? studentId,
      programLabel,
      attendance: 0,
      pendingFees: pendingFeeByStudent.get(studentId) ?? 0,
    };
  });

  const notices = ledgers.slice(0, 6).map((ledger) => {
    const isOverdue = ledger.status.toUpperCase() === 'OVERDUE' || new Date(ledger.dueDate) < new Date();
    return {
      id: ledger._id,
      title: `Fee due for ${studentMap.get(ledger.studentId) ?? ledger.studentId}`,
      date: new Date(ledger.dueDate).toISOString(),
      category: (isOverdue ? 'fees' : 'general') as 'academic' | 'fees' | 'general',
    };
  });

  const homework = payments.map((payment) => ({
    id: payment._id,
    childName: studentMap.get(payment.studentId) ?? payment.studentId,
    subject: `Payment ${payment.method}`,
    dueDate: new Date(payment.paidAt).toISOString(),
    status: 'submitted' as const,
  }));

  return {
    summary: {
      childCount: children.length,
      pendingFees: children.reduce((sum, item) => sum + item.pendingFees, 0),
      activeEnrollments: Array.from(latestEnrollmentByStudent.keys()).length,
      overdueItems,
    },
    children,
    notices,
    homework,
  };
}
