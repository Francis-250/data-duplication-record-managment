import { redirect } from "next/navigation";
import { getServerSession } from "@/hooks/get-server-session";
import { roleHome } from "@/lib/auth-routing";
import prisma from "@/lib/prisma";

export function isDoctorRole(role?: string | null) {
  return role?.toLowerCase() === "doctor";
}

export async function requireDoctorPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (!isDoctorRole(session.user.role)) {
    redirect(roleHome(session.user.role));
  }

  const profile = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      specialization: true,
      hospitalName: true,
      licenseNumber: true,
      isApprovedByAdmin: true,
    },
  });
  if (
    !profile?.specialization ||
    !profile.hospitalName ||
    !profile.licenseNumber ||
    !profile.isApprovedByAdmin
  ) {
    redirect("/auth/doctor-pending");
  }

  return session;
}

export async function requireDoctorAction() {
  const session = await getServerSession();

  if (!session?.user || !isDoctorRole(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { isApprovedByAdmin: true },
  });
  if (!profile?.isApprovedByAdmin) {
    throw new Error("Doctor approval is required.");
  }

  return session;
}
