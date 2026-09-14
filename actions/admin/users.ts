"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

const allowedRoles = new Set(["patient", "doctor", "admin"]);

export async function setUserRole(userId: string, role: string) {
  const session = await requireAdminAction();
  const normalized = role.toLowerCase();
  if (!allowedRoles.has(normalized)) throw new Error("Invalid role.");
  if (userId === session.user.id) throw new Error("You cannot change your own role.");

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: normalized } }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_ROLE_CHANGED",
        entity: "User",
        entityId: userId,
        description: `Administrator changed user role to ${normalized}.`,
        metadata: { role: normalized },
      },
    }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

export async function setUserBanned(userId: string, banned: boolean) {
  const session = await requireAdminAction();
  if (userId === session.user.id) throw new Error("You cannot ban your own account.");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { banned, banReason: banned ? "Suspended by administrator" : null, banExpires: null },
    }),
    prisma.session.deleteMany({ where: { userId: banned ? userId : "__none__" } }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: banned ? "USER_BANNED" : "USER_UNBANNED",
        entity: "User",
        entityId: userId,
        description: banned ? "Administrator suspended a user." : "Administrator restored a user.",
      },
    }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}
