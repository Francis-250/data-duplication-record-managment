"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/hooks/get-server-session";
import prisma from "@/lib/prisma";

export async function markNotificationRead(id: string) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await prisma.notification.updateMany({
    where: {
      id,
      userId: session.user.id,
      status: "UNREAD",
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  revalidatePath("/patient/notifications");
}

export async function markAllNotificationsRead() {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      status: "UNREAD",
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  revalidatePath("/patient/notifications");
}
