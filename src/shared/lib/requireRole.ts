import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/shared/infrastructure/auth";
import { normalizeUserRole } from "@/domains/user-management/domain/entities/User";

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/signin");

  const role = normalizeUserRole(session.user.role);

  if (!role || !allowedRoles.includes(role)) {
    redirect("/auth/signin");
  }

  return session;
}
