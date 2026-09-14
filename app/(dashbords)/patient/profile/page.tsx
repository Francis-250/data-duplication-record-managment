import { redirect } from "next/navigation";
import { PatientProfileClient } from "@/components/patient-profile-client";
import { getServerSession } from "@/hooks/get-server-session";
import prisma from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function PatientProfile() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      patientProfile: true,
      sessions: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const patient = user.patientProfile;

  return (
    <PatientProfileClient
      user={{
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        phoneNumberVerified: user.phoneNumberVerified,
        username: user.username,
        displayUsername: user.displayUsername,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: formatDate(user.createdAt),
        role: user.role,
        banned: user.banned,
      }}
      patient={{
        age: patient?.age ?? null,
        gender: patient?.gender ?? null,
        bloodType: patient?.bloodType ?? null,
        allergies: patient?.allergies ?? null,
        existingConditions: patient?.existingConditions ?? null,
        smokingStatus: patient?.smokingStatus ?? false,
        diabetic: patient?.diabetic ?? false,
        hypertension: patient?.hypertension ?? false,
        heartDisease: patient?.heartDisease ?? false,
      }}
      sessions={user.sessions.map((item) => ({
        id: item.id,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        createdAt: formatDateTime(item.createdAt),
        updatedAt: formatDateTime(item.updatedAt),
        current: item.id === session.session.id,
      }))}
    />
  );
}
