import { redirect } from "next/navigation";
import {
  PatientNotificationsClient,
  type PatientNotificationItem,
} from "@/components/patient-notifications-client";
import { getServerSession } from "@/hooks/get-server-session";
import prisma from "@/lib/prisma";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function Alerts() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      status: true,
      createdAt: true,
      assessmentId: true,
    },
  });

  const initialNotifications: PatientNotificationItem[] = notifications.map(
    (notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      date: formatDateTime(notification.createdAt),
      assessmentId: notification.assessmentId,
    }),
  );

  return (
    <PatientNotificationsClient
      initialNotifications={initialNotifications}
    />
  );
}
