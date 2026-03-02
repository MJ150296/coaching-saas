import { Badge } from '@/shared/components/ui/Badge';
import { SearchableDropdown } from '@/shared/components/ui/SearchableDropdown';
import { UserRole } from '@/domains/user-management/domain/entities/User';

type Option = { value: string; label: string };

interface TenantSelectorsCardProps {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  actorRole?: UserRole;
  isLoadingOrganizations?: boolean;
  isLoadingSchools?: boolean;
  canSelectOrganization: boolean;
  canSelectSchool: boolean;
  organizationId: string;
  schoolId: string;
  organizationSearch: string;
  schoolSearch: string;
  tenantOrganizationOptions: Option[];
  tenantSchoolOptions: Option[];
  recentOrganizationId: string;
  recentSchoolId: string;
  onOrganizationChange: (value: string) => void;
  onSchoolChange: (value: string) => void;
  onOrganizationSearchChange: (value: string) => void;
  onSchoolSearchChange: (value: string) => void;
  onRefreshOrganizations: () => void;
  onRefreshSchools: () => void;
}

export function TenantSelectorsCard({
  status,
  actorRole,
  isLoadingOrganizations = false,
  isLoadingSchools = false,
  canSelectOrganization,
  canSelectSchool,
  organizationId,
  schoolId,
  organizationSearch,
  schoolSearch,
  tenantOrganizationOptions,
  tenantSchoolOptions,
  recentOrganizationId,
  recentSchoolId,
  onOrganizationChange,
  onSchoolChange,
  onOrganizationSearchChange,
  onSchoolSearchChange,
  onRefreshOrganizations,
  onRefreshSchools,
}: TenantSelectorsCardProps) {
  const showOrganizationSkeleton = isLoadingOrganizations && tenantOrganizationOptions.length === 0;
  const showSchoolSkeleton = isLoadingSchools && tenantSchoolOptions.length === 0;

  return (
    <section className="rounded-lg bg-white p-4 shadow" aria-busy={showOrganizationSkeleton || showSchoolSkeleton}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Tenant Context</h2>
        </div>
        {status === 'authenticated' && actorRole && <Badge variant="blue">Role: {actorRole}</Badge>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!canSelectOrganization && <Badge variant="gray">Organization locked by role</Badge>}
        {!canSelectSchool && <Badge variant="gray">Coaching center locked by role</Badge>}
        {recentOrganizationId && <Badge variant="green">Recent Org: {recentOrganizationId}</Badge>}
        {recentSchoolId && <Badge variant="green">Recent Coaching Center: {recentSchoolId}</Badge>}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {showOrganizationSkeleton ? (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : (
          <SearchableDropdown
            options={tenantOrganizationOptions}
            value={organizationId}
            onChange={onOrganizationChange}
            search={organizationSearch}
            onSearchChange={onOrganizationSearchChange}
            placeholder={canSelectOrganization ? 'Select organization' : 'Organization prefilled'}
            searchPlaceholder="Search organization by name or ID"
            disabled={!canSelectOrganization}
            label="Organization"
          />
        )}

        {showSchoolSkeleton ? (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : (
          <SearchableDropdown
            options={tenantSchoolOptions}
            value={schoolId}
            onChange={onSchoolChange}
            search={schoolSearch}
            onSearchChange={onSchoolSearchChange}
            placeholder={
              !organizationId
                ? 'Select organization first'
                : canSelectSchool
                  ? 'Select coaching center'
                  : 'Coaching center prefilled'
            }
            searchPlaceholder="Search coaching center by name or ID"
            disabled={!organizationId || !canSelectSchool}
            label="Coaching Center"
          />
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
        {canSelectSchool && (
          <button
            onClick={onRefreshSchools}
            disabled={!organizationId || isLoadingSchools}
            className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingSchools ? 'Refreshing...' : 'Refresh Coaching Centers'}
          </button>
        )}
      </div>
    </section>
  );
}
