"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import { GLOBAL_AI_DAILY_LIMIT_KEY } from "@/lib/ai-limits";
import prisma from "@/lib/prisma";

function normalizeLimit(value: number | null) {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 0 || value > 1000) {
    throw new Error("Limit must be a whole number from 0 to 1000.");
  }
  return value;
}

export async function setGlobalAiDailyLimit(limit: number | null) {
  const session = await requireAdminAction();
  const normalized = normalizeLimit(limit);

  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: GLOBAL_AI_DAILY_LIMIT_KEY },
      create: {
        key: GLOBAL_AI_DAILY_LIMIT_KEY,
        value: normalized === null ? "-1" : String(normalized),
        description: "Default daily AI assessment limit for all patients. -1 means unlimited.",
        updatedBy: session.user.id,
      },
      update: {
        value: normalized === null ? "-1" : String(normalized),
        updatedBy: session.user.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "AI_LIMIT_UPDATED",
        entity: "SystemSetting",
        entityId: GLOBAL_AI_DAILY_LIMIT_KEY,
        description: `Administrator set the global daily AI assessment limit to ${normalized ?? "unlimited"}.`,
      },
    }),
  ]);

  revalidatePath("/admin/ai");
}

export async function setUserAiDailyLimit(userId: string, limit: number | null) {
  const session = await requireAdminAction();
  const normalized = normalizeLimit(limit);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { aiDailyAssessmentLimit: normalized },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "AI_LIMIT_UPDATED",
        entity: "User",
        entityId: userId,
        description: `Administrator set a user AI limit override to ${normalized ?? "the global default"}.`,
      },
    }),
  ]);

  revalidatePath("/admin/ai");
  revalidatePath("/admin/users");
}
