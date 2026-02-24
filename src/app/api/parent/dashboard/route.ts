import { NextResponse } from 'next/server';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { StudentEnrollmentModel, ClassMasterModel, SectionModel } from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import { StudentFeeLedgerModel, PaymentModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';
import { ParentStudentLinkModel } from '@/domains/user-management/infrastructure/persistence/ParentStudentLinkSchema';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { getActorUser } from '@/shared/infrastructure/actor';
import { connectDB } from '@/shared/infrastructure/database';

type LinkedStudent = {
  _id: string;
  firstName: string;
  lastName: string;
};

type EnrollmentDoc = {
  studentId: string;
  classMasterId: string;
  sectionId: string;
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

export async function GET() {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (actor.getRole() !== UserRole.PARENT) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const linkQuery: Record<string, unknown> = { parentId: actor.getId() };
    if (actor.getOrganizationId()) linkQuery.organizationId = actor.getOrganizationId();
    if (actor.getSchoolId()) linkQuery.schoolId = actor.getSchoolId();

    const links = await ParentStudentLinkModel.find(linkQuery)
      .lean<Array<{ studentId: string }>>();

    const studentIds = Array.from(new Set(links.map((item) => item.studentId)));
    if (studentIds.length === 0) {
      return NextResponse.json({
        summary: { childCount: 0, pendingFees: 0, activeEnrollments: 0, overdueItems: 0 },
        children: [],
        notices: [],
        homework: [],
      });
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

    const classIds = Array.from(new Set(Array.from(latestEnrollmentByStudent.values()).map((item) => item.classMasterId)));
    const sectionIds = Array.from(new Set(Array.from(latestEnrollmentByStudent.values()).map((item) => item.sectionId)));

    const [classes, sections] = await Promise.all([
      classIds.length > 0
        ? ClassMasterModel.find({ _id: { $in: classIds } }).lean<Array<{ _id: string; name: string }>>()
        : Promise.resolve([]),
      sectionIds.length > 0
        ? SectionModel.find({ _id: { $in: sectionIds } }).lean<Array<{ _id: string; name: string }>>()
        : Promise.resolve([]),
    ]);

    const classMap = new Map(classes.map((item) => [item._id, item.name]));
    const sectionMap = new Map(sections.map((item) => [item._id, item.name]));
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
      const className = enrollment ? classMap.get(enrollment.classMasterId) ?? enrollment.classMasterId : 'Not Enrolled';
      const sectionName = enrollment ? sectionMap.get(enrollment.sectionId) ?? enrollment.sectionId : '';
      const classLabel = sectionName ? `${className} - ${sectionName}` : className;

      return {
        id: studentId,
        name: studentMap.get(studentId) ?? studentId,
        classLabel,
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
        category: isOverdue ? 'fees' : 'general',
      };
    });

    const homework = payments.map((payment) => ({
      id: payment._id,
      childName: studentMap.get(payment.studentId) ?? payment.studentId,
      subject: `Payment ${payment.method}`,
      dueDate: new Date(payment.paidAt).toISOString(),
      status: 'submitted' as const,
    }));

    return NextResponse.json({
      summary: {
        childCount: children.length,
        pendingFees: children.reduce((sum, item) => sum + item.pendingFees, 0),
        activeEnrollments: Array.from(latestEnrollmentByStudent.keys()).length,
        overdueItems,
      },
      children,
      notices,
      homework,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
