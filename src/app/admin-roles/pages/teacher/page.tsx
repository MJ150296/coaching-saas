import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { Badge } from '@/shared/components/ui/Badge';
import { PdfExportButton } from '@/shared/components/ui/PdfExportButton';
import { parsePositiveIntParam } from '@/shared/lib/utils';
import { getUserAnalyticsTable } from '@/shared/lib/user-analytics.server';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildPageHref(paramsInput: SearchParams, page: number): string {
  const params = new URLSearchParams();
  Object.entries(paramsInput).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
      return;
    }
    params.set(key, value);
  });
  params.set('page', String(page));
  return `?${params.toString()}`;
}

export default async function TeacherAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = { ...(await searchParams) };
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  const role = actor.getRole();
  if (
    role !== UserRole.SUPER_ADMIN &&
    role !== UserRole.ORGANIZATION_ADMIN &&
    role !== UserRole.COACHING_ADMIN &&
    role !== UserRole.ADMIN
  ) {
    redirect('/auth/signin');
  }

  const page = Math.max(1, parsePositiveIntParam(getParam(resolvedSearchParams, 'page'), 1000) ?? 1);
  const limit = parsePositiveIntParam(getParam(resolvedSearchParams, 'limit'), 200) ?? 50;
  const query = getParam(resolvedSearchParams, 'q')?.trim();
  const status = (getParam(resolvedSearchParams, 'status') as 'active' | 'inactive' | 'all' | undefined) ?? 'all';
  const verified = (getParam(resolvedSearchParams, 'verified') as 'verified' | 'unverified' | 'all' | undefined) ?? 'all';

  const data = await getUserAnalyticsTable({
    role: UserRole.TEACHER,
    page,
    limit,
    query,
    status,
    verified,
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/35 to-teal-50/40 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Teacher Analytics</h1>
      <p className="mt-2 text-sm text-slate-600">Searchable teacher register with scope-aware summary metrics.</p>

      <form method="GET" className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
          <input
            name="q"
            defaultValue={query ?? ''}
            placeholder="Name, email, phone"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select name="status" defaultValue={status} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</label>
          <select name="verified" defaultValue={verified} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Page Size</label>
          <select name="limit" defaultValue={String(limit)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            {[25, 50, 100, 200].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-5 flex flex-wrap items-center gap-2">
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Apply Filters
          </button>
          <span className="text-xs text-slate-500">Showing {data.items.length} of {data.total.toLocaleString()} teachers</span>
        </div>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard title="Total Teachers" value={data.total} />
        <MetricCard title="Loaded Records" value={data.items.length} />
        <MetricCard title="Active Teachers" value={data.activeCount} />
        <MetricCard title="Email Verified" value={data.verifiedCount} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Teacher Roster</h2>
          <PdfExportButton
            filename="teachers-roster.pdf"
            title="Teacher Roster"
            rows={data.items}
            columns={[
              { key: 'firstName', label: 'First Name' },
              { key: 'lastName', label: 'Last Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'coachingCenterId', label: 'Center' },
              { key: 'isActive', label: 'Active' },
              { key: 'emailVerified', label: 'Verified' },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Coaching Center</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
            {data.items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2 text-sm text-slate-700">
                  <a
                    href={`/profile/users/${encodeURIComponent(item.id)}`}
                    className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                  >
                    {item.firstName} {item.lastName}
                  </a>
                </td>
                <td className="px-3 py-2 text-sm text-slate-700">{item.email}</td>
                <td className="px-3 py-2 text-sm text-slate-700">{item.phone || '-'}</td>
                <td className="px-3 py-2 text-sm">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={item.isActive ? 'green' : 'yellow'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant={item.emailVerified ? 'blue' : 'gray'}>
                      {item.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-slate-700">{item.coachingCenterId || '-'}</td>
                <td className="px-3 py-2 text-sm text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                  No teachers found with current filters.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">Distinct coaching centers: {data.distinctCenters}</p>
        <div className="flex items-center gap-2 text-sm">
          <a
            className={`rounded-lg border px-3 py-1 ${data.page <= 1 ? 'pointer-events-none text-slate-300' : 'text-slate-700'}`}
            href={buildPageHref(resolvedSearchParams, Math.max(1, data.page - 1))}
          >
            Previous
          </a>
          <span className="text-slate-600">Page {data.page} of {data.totalPages}</span>
          <a
            className={`rounded-lg border px-3 py-1 ${data.page >= data.totalPages ? 'pointer-events-none text-slate-300' : 'text-slate-700'}`}
            href={buildPageHref(resolvedSearchParams, Math.min(data.totalPages, data.page + 1))}
          >
            Next
          </a>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}
