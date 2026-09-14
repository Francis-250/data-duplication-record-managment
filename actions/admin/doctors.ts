"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function setDoctorApproval(profileId: string, approved: boolean) {
  const session = await requireAdminAction();

  await prisma.$transaction([
    prisma.doctorProfile.update({
      where: { id: profileId },
      data: {
        isApprovedByAdmin: approved,
        approvedByAdminAt: approved ? new Date() : null,
        approvalRejectedAt: approved ? null : new Date(),
        approvalRejectionReason: approved ? null : "Approval revoked by administrator",
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: approved ? "DOCTOR_VERIFIED" : "DOCTOR_UNVERIFIED",
        entity: "DoctorProfile",
        entityId: profileId,
        description: approved ? "Administrator approved a doctor." : "Administrator revoked doctor approval.",
      },
    }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/admin/doctors");
}

export async function reviewDoctorApplication(input: {
  profileId: string;
  decision: "APPROVE" | "REJECT";
  reason?: string;
}) {
  const session = await requireAdminAction();
  const approved = input.decision === "APPROVE";
  const reason = input.reason?.trim();
  if (!approved && !reason) throw new Error("A rejection reason is required.");

  const profile = await prisma.doctorProfile.findUnique({
    where: { id: input.profileId },
    select: { id: true, licenseNumber: true },
  });
  if (!profile) throw new Error("Doctor profile not found.");
  if (approved && !profile.licenseNumber) {
    throw new Error("A medical license number is required before approval.");
  }

  await prisma.$transaction([
    prisma.doctorProfile.update({
      where: { id: profile.id },
      data: {
        isApprovedByAdmin: approved,
        approvedByAdminAt: approved ? new Date() : null,
        isVerified: approved,
        verifiedAt: approved ? new Date() : null,
        approvalRejectedAt: approved ? null : new Date(),
        approvalRejectionReason: approved ? null : reason,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: approved ? "DOCTOR_VERIFIED" : "DOCTOR_UNVERIFIED",
        entity: "DoctorProfile",
        entityId: profile.id,
        description: approved
          ? "Administrator approved and verified a doctor application."
          : `Administrator rejected a doctor application: ${reason}`,
        metadata: { decision: input.decision, reason: reason ?? null },
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/doctors");
  revalidatePath(`/admin/doctors/${profile.id}`);
}

export async function setDoctorVerified(profileId: string, verified: boolean) {
  const session = await requireAdminAction();

  await prisma.$transaction([
    prisma.doctorProfile.update({
      where: { id: profileId },
      data: { isVerified: verified, verifiedAt: verified ? new Date() : null },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: verified ? "DOCTOR_VERIFIED" : "DOCTOR_UNVERIFIED",
        entity: "DoctorProfile",
        entityId: profileId,
        description: verified ? "Administrator verified doctor credentials." : "Administrator removed doctor verification.",
      },
    }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/admin/doctors");
}
