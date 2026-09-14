import { redirect } from "next/navigation";
import { getServerSession } from "@/hooks/get-server-session";
import { roleHome } from "@/lib/auth-routing";

export function isAdminRole(role?: string | null) {
  return role?.toLowerCase() === "admin";
}

export async function requireAdminPage() {
  const session = await getServerSession();

  if (!session?.user) redirect("/auth/login");
  if (!isAdminRole(session.user.role)) redirect(roleHome(session.user.role));

  return session;
}

export async function requireAdminAction() {
  const session = await getServerSession();

  if (!session?.user || !isAdminRole(session.user.role)) {
    throw new Error("Unauthorized");
  }

  return session;
}
