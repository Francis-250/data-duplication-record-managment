import { roleHome } from "@/lib/auth-routing";
import prisma from "@/lib/prisma";

export async function getPostLoginDestination(user: {
  id: string;
  role?: string | null;
}) {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, banned: true, banReason: true },
  });

  if (dbUser?.banned) {
    return {
      destination: "/auth/login",
      blocked: true,
      reason: dbUser.banReason ?? "Your account has been suspended by an administrator.",
    };
  }

  const userRole = dbUser?.role ?? user.role;
  return {
    destination: roleHome(userRole),
    blocked: false,
    reason: null,
  };
}

export async function setUserInitialRole(userId: string, role: "STUDENT" | "REGISTRY_STAFF") {
  const validRoles = ["STUDENT", "REGISTRY_STAFF"];
  if (!validRoles.includes(role)) {
    throw new Error("Invalid registration role.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}
