import { AdminProfileClient } from "@/components/admin-profile-client";
import { requireAdminPage } from "@/lib/admin-auth";
import { formatAdminDate, formatAdminDateTime } from "@/lib/admin";
import prisma from "@/lib/prisma";

export default async function AdminSettingsPage() {
  const session = await requireAdminPage();
  const [user, users, doctors, assessments, unresolvedFeedback, auditLogs] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: { sessions: { orderBy: { updatedAt: "desc" } } },
      }),
      prisma.user.count(),
      prisma.doctorProfile.count(),
      prisma.assessment.count(),
      prisma.doctorFeedback.count({ where: { status: "PENDING" } }),
      prisma.auditLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  if (!user) return null;

  return (
    <AdminProfileClient
      user={{
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        phoneNumberVerified: user.phoneNumberVerified,
        username: user.username,
        displayUsername: user.displayUsername,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: formatAdminDate(user.createdAt),
      }}
      sessions={user.sessions.map((item) => ({
        id: item.id,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        createdAt: formatAdminDateTime(item.createdAt),
        updatedAt: formatAdminDateTime(item.updatedAt),
        current: item.id === session.session.id,
      }))}
      auditLogs={auditLogs.map((item) => ({
        id: item.id,
        action: item.action,
        description: item.description,
        createdAt: formatAdminDateTime(item.createdAt),
      }))}
      stats={{ users, doctors, assessments, unresolvedFeedback }}
    />
  );
}
