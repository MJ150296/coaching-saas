import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/shared/infrastructure/auth";

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/signin");

  const role = session.user.role;

  if (!allowedRoles.includes(role)) {
    redirect("/auth/signin");
  }

  return session;
}
