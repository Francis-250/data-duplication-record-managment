import { redirect } from "next/navigation";
import { getServerSession } from "@/hooks/get-server-session";
import { roleHome } from "@/lib/auth-routing";

export function isPatientRole(role?: string | null) {
  return role?.toLowerCase() === "patient";
}

export async function requirePatientPage() {
  const session = await getServerSession();

  if (!session?.user) redirect("/auth/login");
  if (!isPatientRole(session.user.role)) redirect(roleHome(session.user.role));

  return session;
}

export async function requirePatientAction() {
  const session = await getServerSession();

  if (!session?.user || !isPatientRole(session.user.role)) {
    throw new Error("Unauthorized");
  }

  return session;
}
