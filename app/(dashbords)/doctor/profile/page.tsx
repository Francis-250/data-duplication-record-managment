import { DoctorProfileClient } from "@/components/doctor-profile-client";
import { requireDoctorPage } from "@/lib/doctor-auth";
import prisma from "@/lib/prisma";

export default async function DoctorProfilePage() {
  const session = await requireDoctorPage();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      doctorProfile: true,
      sessions: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!user) return null;

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);

  return (
    <DoctorProfileClient
      user={{
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        displayUsername: user.displayUsername,
        twoFactorEnabled: user.twoFactorEnabled ?? false,
      }}
      profile={{
        specialization: user.doctorProfile?.specialization ?? null,
        hospitalName: user.doctorProfile?.hospitalName ?? null,
        licenseNumber: user.doctorProfile?.licenseNumber ?? null,
        isVerified: user.doctorProfile?.isVerified ?? false,
      }}
      sessions={user.sessions.map((item) => ({
        id: item.id,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        updatedAt: formatDate(item.updatedAt),
        current: item.id === session.session.id,
      }))}
    />
  );
}
