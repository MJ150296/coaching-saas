import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { getActorUser } from '@/shared/infrastructure/actor';

export async function requireActorWithPermission(permission: Permission) {
  const actor = await getActorUser();
  if (!actor) {
    throw new Error('UNAUTHORIZED');
  }
  if (!hasPermission(actor.getRole(), permission)) {
    throw new Error('FORBIDDEN');
  }
  return actor;
}
