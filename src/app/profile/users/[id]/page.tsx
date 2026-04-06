import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/shared/components/ui/Badge';
import { getActorUser } from '@/shared/infrastructure/actor';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { ParentStudentLinkModel } from '@/domains/user-management/infrastructure/persistence/ParentStudentLinkSchema';
import {
  AcademicYearModel,
  StudentEnrollmentModel,
} from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import { connectDB } from '@/shared/infrastructure/database';

export const dynamic = 'force-dynamic';

type ProfileParams = {
  id: string;
};

function formatDate(value?: Date | string | null): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatRoleLabel(role: string): string {
  return role === UserRole.COACHING_ADMIN ? 'COACHING ADMIN' : role.replaceAll('_', ' ');
}

function getRoleBadgeVariant(role: UserRole): 'blue' | 'green' | 'purple' | 'orange' | 'gray' {
  const variants: Record<UserRole, 'blue' | 'green' | 'purple' | 'orange' | 'gray'> = {
    [UserRole.SUPER_ADMIN]: 'purple',
    [UserRole.ORGANIZATION_ADMIN]: 'blue',
    [UserRole.COACHING_ADMIN]: 'blue',
    [UserRole.ADMIN]: 'blue',
    [UserRole.TEACHER]: 'green',
    [UserRole.STUDENT]: 'orange',
    [UserRole.PARENT]: 'gray',
    [UserRole.STAFF]: 'gray',
  };
  return variants[role] ?? 'gray';
}

export default async function UserProfilePage({ params }: { params: Promise<ProfileParams> }) {
  const resolvedParams = await params;
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  const actorRole = actor.getRole();

  await connectDB();
  const user = await UserModel.findById(resolvedParams.id)
    .select('_id email firstName lastName phone role organizationId coachingCenterId schoolGrade schoolName isActive emailVerified createdAt updatedAt')
    .lean<{
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: UserRole;
      organizationId?: string;
      coachingCenterId?: string;
      schoolGrade?: string;
      schoolName?: string;
      isActive: boolean;
      emailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>();

  if (!user) {
    notFound();
  }

  const sameTenant =
    actor.getOrganizationId() === user.organizationId &&
    actor.getCoachingCenterId() === user.coachingCenterId;

  let allowed = false;

  if (
    actorRole === UserRole.SUPER_ADMIN ||
    actorRole === UserRole.ORGANIZATION_ADMIN ||
    actorRole === UserRole.COACHING_ADMIN ||
    actorRole === UserRole.ADMIN
  ) {
    // Admin roles can view any user profile (cross-tenant access for admin operations)
    allowed = true;
  } else if (actorRole === UserRole.TEACHER) {
    // Teachers can only view their own profile
    if (actor.getId() === user._id) {
      allowed = true;
    }
  } else if (actorRole === UserRole.PARENT) {
    if (actor.getId() === user._id) {
      allowed = true;
    } else if (user.role === UserRole.STUDENT && sameTenant) {
      const link = await ParentStudentLinkModel.findOne({
        parentId: actor.getId(),
        studentId: user._id,
        organizationId: user.organizationId,
        coachingCenterId: user.coachingCenterId,
      })
        .select('_id')
        .lean<{ _id: string } | null>();
      allowed = Boolean(link);
    }
  } else if (actorRole === UserRole.STUDENT || actorRole === UserRole.STAFF) {
    allowed = actor.getId() === user._id;
  }

  if (!allowed) {
    notFound();
  }

  const [parentLinks, childLinks] = await Promise.all([
    user.role === UserRole.STUDENT
      ? ParentStudentLinkModel.find({ studentId: user._id }).lean<Array<{ parentId: string }>>()
      : Promise.resolve([]),
    user.role === UserRole.PARENT
      ? ParentStudentLinkModel.find({ parentId: user._id }).lean<Array<{ studentId: string }>>()
      : Promise.resolve([]),
  ]);

  const relatedUserIds = [
    ...parentLinks.map((link) => link.parentId),
    ...childLinks.map((link) => link.studentId),
  ];

  const relatedUsers = relatedUserIds.length
    ? await UserModel.find({ _id: { $in: relatedUserIds } })
        .select('_id firstName lastName email role')
        .lean<Array<{ _id: string; firstName: string; lastName: string; email: string; role: UserRole }>>()
    : [];

  const relatedUserMap = new Map(relatedUsers.map((item) => [item._id, item]));

  const enrollments = user.role === UserRole.STUDENT
    ? await StudentEnrollmentModel.find({ studentId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<Array<{
          academicYearId: string;
          programId: string;
          batchId?: string;
          rollNumber?: string;
          createdAt: Date;
        }>>()
    : [];

  const academicYearIds = Array.from(new Set(enrollments.map((item) => item.academicYearId)));

  const academicYears = academicYearIds.length
    ? await AcademicYearModel.find({ _id: { $in: academicYearIds } }).lean<Array<{ _id: string; name: string }>>()
    : [];

  const yearMap = new Map(academicYears.map((item) => [item._id, item.name]));

  // eslint-disable-next-line react-hooks/purity -- Server Component: impure functions are acceptable as result is baked into static HTML
  const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/35 to-indigo-50/40 py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 shadow-lg shadow-blue-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="mt-1 text-sm text-blue-100">{user.email}</p>
                <p className="mt-1 text-xs text-blue-200">Account created {accountAge} days ago</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={user.isActive ? 'green' : 'yellow'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
              <Badge variant={user.emailVerified ? 'blue' : 'gray'}>{user.emailVerified ? 'Verified' : 'Unverified'}</Badge>
              <Badge variant={getRoleBadgeVariant(user.role)}>{formatRoleLabel(user.role)}</Badge>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatRoleLabel(user.role)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{user.isActive ? 'Active' : 'Inactive'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked Profiles</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{parentLinks.length + childLinks.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Age</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{accountAge} days</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Account Details */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
            <h2 className="text-lg font-semibold text-slate-900">Account Details</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-sm font-medium text-slate-600">User ID</span>
                <span className="text-sm text-slate-900 font-mono">{user._id}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-sm font-medium text-slate-600">Email</span>
                <span className="text-sm text-slate-900">{user.email}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-sm font-medium text-slate-600">Phone</span>
                <span className="text-sm text-slate-900">{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-sm font-medium text-slate-600">Organization</span>
                <span className="text-sm text-slate-900">{user.organizationId || 'Not assigned'}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-sm font-medium text-slate-600">Coaching Center</span>
                <span className="text-sm text-slate-900">{user.coachingCenterId || 'Not assigned'}</span>
              </div>
              {user.role === UserRole.STUDENT && (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <span className="text-sm font-medium text-slate-600">School Name</span>
                    <span className="text-sm text-slate-900">{user.schoolName || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <span className="text-sm font-medium text-slate-600">Class/Grade</span>
                    <span className="text-sm text-slate-900">{user.schoolGrade || 'Not provided'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Linked Profiles */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
            <h2 className="text-lg font-semibold text-slate-900">
              {user.role === UserRole.PARENT ? 'Linked Students' : user.role === UserRole.STUDENT ? 'Linked Parents' : 'Linked Profiles'}
            </h2>
            <div className="mt-4 space-y-3">
              {user.role === UserRole.STUDENT && parentLinks.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-center">
                  <p className="text-sm text-slate-500">No parent links found.</p>
                </div>
              ) : null}
              {user.role === UserRole.PARENT && childLinks.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-center">
                  <p className="text-sm text-slate-500">No student links found.</p>
                </div>
              ) : null}
              {user.role !== UserRole.STUDENT && user.role !== UserRole.PARENT ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-center">
                  <p className="text-sm text-slate-500">This role has no linked profiles.</p>
                </div>
              ) : null}
              {parentLinks.map((link) => {
                const parent = relatedUserMap.get(link.parentId);
                if (!parent) return null;
                return (
                  <div key={link.parentId} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <a href={`/profile/users/${encodeURIComponent(parent._id)}`} className="font-semibold text-slate-800 hover:text-blue-600 hover:underline">
                          {parent.firstName} {parent.lastName}
                        </a>
                        <p className="mt-1 text-xs text-slate-500">{parent.email}</p>
                      </div>
                      <Badge variant={getRoleBadgeVariant(parent.role)}>{formatRoleLabel(parent.role)}</Badge>
                    </div>
                  </div>
                );
              })}
              {childLinks.map((link) => {
                const student = relatedUserMap.get(link.studentId);
                if (!student) return null;
                return (
                  <div key={link.studentId} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <a href={`/profile/users/${encodeURIComponent(student._id)}`} className="font-semibold text-slate-800 hover:text-blue-600 hover:underline">
                          {student.firstName} {student.lastName}
                        </a>
                        <p className="mt-1 text-xs text-slate-500">{student.email}</p>
                      </div>
                      <Badge variant={getRoleBadgeVariant(student.role)}>{formatRoleLabel(student.role)}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Timestamps */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-linear-to-br from-green-50 to-emerald-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Created</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{formatDate(user.createdAt)}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDateTime(user.createdAt)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-linear-to-br from-blue-50 to-indigo-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Updated</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{formatDate(user.updatedAt)}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDateTime(user.updatedAt)}</p>
            </div>
          </div>
        </section>

        {/* Enrollment Snapshot for Students */}
        {user.role === UserRole.STUDENT ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Enrollment Snapshot</h2>
              <span className="text-xs font-medium text-slate-500">{enrollments.length} records</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Academic Year</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Roll Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Enrolled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {enrollments.map((item, index) => (
                    <tr key={`${item.academicYearId}-${item.programId}-${item.batchId ?? 'none'}-${index}`} className="transition hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{yearMap.get(item.academicYearId) ?? item.academicYearId}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.programId}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.batchId ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.rollNumber ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                        No enrollment records found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Quick Actions */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/profile/settings"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Profile Settings
            </a>
            <a
              href="/admin-roles/admin"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Dashboard
            </a>
            <a
              href="/admin-roles/manage-setting/users"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Manage Users
            </a>
            <a
              href={`/admin-roles/pages/student`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
            >
              Student Analytics
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
