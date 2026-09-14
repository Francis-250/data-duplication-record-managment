"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function setDatasetActive(datasetId: string, active: boolean) {
  const session = await requireAdminAction();
  await prisma.$transaction([
    prisma.aiDataset.update({ where: { id: datasetId }, data: { isActive: active } }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_DATASET_UPLOADED",
        entity: "AiDataset",
        entityId: datasetId,
        description: `Administrator ${active ? "activated" : "deactivated"} an AI dataset.`,
        metadata: { active },
      },
    }),
  ]);
  revalidatePath("/admin/ai");
}

export async function saveSystemSetting(input: {
  id?: string;
  key: string;
  value: string;
  description?: string;
}) {
  const session = await requireAdminAction();
  const key = input.key.trim();
  if (!key) throw new Error("Setting key is required.");

  await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value: input.value,
      description: input.description?.trim() || null,
      updatedBy: session.user.id,
    },
    update: {
      value: input.value,
      description: input.description?.trim() || null,
      updatedBy: session.user.id,
    },
  });
  revalidatePath("/admin/settings");
}
