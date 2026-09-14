"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

const clean = (value?: string | null) => value?.trim() || null;

export async function updateAdminAccount(input: {
  name: string;
  phoneNumber?: string;
  displayUsername?: string;
}) {
  const session = await requireAdminAction();
  const name = input.name.trim();
  if (!name) throw new Error("Name is required.");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phoneNumber: clean(input.phoneNumber),
        displayUsername: clean(input.displayUsername),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_ROLE_CHANGED",
        entity: "User",
        entityId: session.user.id,
        description: "Administrator updated their profile.",
      },
    }),
  ]);

  revalidatePath("/admin/settings");
}

export async function revokeAdminSession(sessionId: string) {
  const session = await requireAdminAction();
  if (session.session.id === sessionId) {
    throw new Error("You cannot revoke your current session.");
  }

  await prisma.session.deleteMany({
    where: { id: sessionId, userId: session.user.id },
  });

  revalidatePath("/admin/settings");
}
