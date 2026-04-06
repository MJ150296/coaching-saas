import { Badge } from '@/shared/components/ui/Badge';
import { MultiSelect } from '@/components/multi-select';
import { UserRole } from '@/domains/user-management/domain/entities/User';

type Option = { value: string; label: string };

interface TenantSelectorsCardProps {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  actorRole?: UserRole;
  isLoadingOrganizations?: boolean;
  isLoadingCoachingCenters?: boolean;
  canSelectOrganization: boolean;
  canSelectCoachingCenter: boolean;
  organizationId: string;
  coachingCenterId: string;
  organizationSearch: string;
  coachingCenterSearch: string;
  tenantOrganizationOptions: Option[];
  tenantCoachingCenterOptions: Option[];
  recentOrganizationId: string;
  recentCoachingCenterId: string;
  onOrganizationChange: (value: string) => void;
  onCoachingCenterChange: (value: string) => void;
  onOrganizationSearchChange: (value: string) => void;
  onCoachingCenterSearchChange: (value: string) => void;
  onRefreshOrganizations: () => void;
  onRefreshCoachingCenters: () => void;
}

export function TenantSelectorsCard({
  status,
  actorRole,
  isLoadingOrganizations = false,
  isLoadingCoachingCenters = false,
  canSelectOrganization,
  canSelectCoachingCenter,
  organizationId,
  coachingCenterId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  organizationSearch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  coachingCenterSearch,
  tenantOrganizationOptions,
  tenantCoachingCenterOptions,
  recentOrganizationId,
  recentCoachingCenterId,
  onOrganizationChange,
  onCoachingCenterChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOrganizationSearchChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCoachingCenterSearchChange,
  onRefreshOrganizations,
  onRefreshCoachingCenters,
}: TenantSelectorsCardProps) {
  const showOrganizationSkeleton = isLoadingOrganizations && tenantOrganizationOptions.length === 0;
  const showCoachingCenterSkeleton = isLoadingCoachingCenters && tenantCoachingCenterOptions.length === 0;

  return (
    <section className="rounded-lg bg-white p-4 shadow" aria-busy={showOrganizationSkeleton || showCoachingCenterSkeleton}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Tenant Context</h2>
        </div>
        {status === 'authenticated' && actorRole && <Badge variant="blue">Role: {actorRole}</Badge>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!canSelectOrganization && <Badge variant="gray">Organization locked by role</Badge>}
        {!canSelectCoachingCenter && <Badge variant="gray">Coaching center locked by role</Badge>}
        {recentOrganizationId && <Badge variant="green">Recent Org: {recentOrganizationId}</Badge>}
        {recentCoachingCenterId && <Badge variant="green">Recent Coaching Center: {recentCoachingCenterId}</Badge>}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {showOrganizationSkeleton ? (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Organization</label>
            <MultiSelect
              options={tenantOrganizationOptions}
              value={organizationId ? [organizationId] : []}
              onValueChange={(values) => onOrganizationChange(values[0] || '')}
              placeholder={canSelectOrganization ? 'Select organization' : 'Organization prefilled'}
              disabled={!canSelectOrganization}
              singleSelect
            />
          </div>
        )}

        {showCoachingCenterSkeleton ? (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Coaching Center</label>
            <MultiSelect
              options={tenantCoachingCenterOptions}
              value={coachingCenterId ? [coachingCenterId] : []}
              onValueChange={(values) => onCoachingCenterChange(values[0] || '')}
              placeholder={
                !organizationId
                  ? 'Select organization first'
                  : canSelectCoachingCenter
                    ? 'Select coaching center'
                    : 'Coaching center prefilled'
              }
              disabled={!organizationId || !canSelectCoachingCenter}
              singleSelect
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canSelectOrganization && (
          <button
            onClick={onRefreshOrganizations}
            disabled={isLoadingOrganizations}
            className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {isLoadingOrganizations ? 'Refreshing...' : 'Refresh Organizations'}
          </button>
        )}
        {canSelectCoachingCenter && (
          <button
            onClick={onRefreshCoachingCenters}
            disabled={!organizationId || isLoadingCoachingCenters}
            className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingCoachingCenters ? 'Refreshing...' : 'Refresh Coaching Centers'}
          </button>
        )}
      </div>
    </section>
  );
}
