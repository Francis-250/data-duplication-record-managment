import { redirect } from "next/navigation";
import { getServerSession } from "@/hooks/get-server-session";
import { roleHome } from "@/lib/auth-routing";

export function isRegistryRole(role?: string | null) {
  const normalized = role?.toUpperCase();
  return normalized === "REGISTRY_STAFF" || normalized === "ADMIN";
}

export async function requireRegistryPage() {
  const session = await getServerSession();

  if (!session?.user) redirect("/auth/login");
  if (!isRegistryRole(session.user.role)) redirect(roleHome(session.user.role));

  return session;
}

export async function requireRegistryAction() {
  const session = await getServerSession();

  if (!session?.user || !isRegistryRole(session.user.role)) {
    throw new Error("Unauthorized: Registry Staff access required.");
  }

  return session;
}
