import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import UsersManagementClient from './UsersManagementClient';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function UsersManagementPage({
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

  return (
    <UsersManagementClient
      initialActorRole={role}
      initialOrganizationId={actor.getOrganizationId() ?? ''}
      initialCoachingCenterId={actor.getCoachingCenterId() ?? ''}
      initialListRoleFilter={getParam(resolvedSearchParams, 'role') ?? ''}
      initialUserSearchText={getParam(resolvedSearchParams, 'q') ?? ''}
    />
  );
}