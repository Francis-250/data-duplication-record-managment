import { redirect } from "next/navigation";
import { getServerSession } from "@/hooks/get-server-session";
import { roleHome } from "@/lib/auth-routing";

export function isStudentRole(role?: string | null) {
  const normalized = role?.toUpperCase();
  return normalized === "STUDENT" || normalized === "ADMIN";
}

export async function requireStudentPage() {
  const session = await getServerSession();

  if (!session?.user) redirect("/auth/login");
  if (!isStudentRole(session.user.role)) redirect(roleHome(session.user.role));

  return session;
}

export async function requireStudentAction() {
  const session = await getServerSession();

  if (!session?.user || !isStudentRole(session.user.role)) {
    throw new Error("Unauthorized: Student access required.");
  }

  return session;
}
