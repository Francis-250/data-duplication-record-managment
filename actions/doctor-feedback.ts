"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import { requirePatientAction } from "@/lib/patient-auth";
import prisma from "@/lib/prisma";

export async function submitDoctorFeedback(input: {
  assessmentId: string;
  doctorProfileId: string;
  comment: string;
}) {
  const session = await requirePatientAction();
  const comment = input.comment.trim();
  if (comment.length < 10) throw new Error("Please provide at least 10 characters.");

  const assignment = await prisma.patientDoctorAssignment.findFirst({
    where: {
      assessmentId: input.assessmentId,
      patientUserId: session.user.id,
      doctorProfileId: input.doctorProfileId,
    },
    select: { id: true },
  });
  if (!assignment) throw new Error("You can only comment on the doctor assigned to this assessment.");

  await prisma.$transaction([
    prisma.doctorFeedback.upsert({
      where: {
        assessmentId_patientUserId_doctorProfileId: {
          assessmentId: input.assessmentId,
          patientUserId: session.user.id,
          doctorProfileId: input.doctorProfileId,
        },
      },
      create: {
        assessmentId: input.assessmentId,
        patientUserId: session.user.id,
        doctorProfileId: input.doctorProfileId,
        comment,
      },
      update: {
        comment,
        status: "PENDING",
        adminNote: null,
        reviewedByUserId: null,
        reviewedAt: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCTOR_FEEDBACK_ADDED",
        entity: "DoctorProfile",
        entityId: input.doctorProfileId,
        description: "Patient submitted feedback about an assigned doctor.",
        metadata: { assessmentId: input.assessmentId },
      },
    }),
  ]);

  revalidatePath(`/patient/assessment/${input.assessmentId}`);
  revalidatePath("/admin/feedback");
}

export async function reviewDoctorFeedback(input: {
  feedbackId: string;
  action: "RESOLVE" | "REVOKE_APPROVAL";
  adminNote?: string;
}) {
  const session = await requireAdminAction();
  const adminNote = input.adminNote?.trim();
  if (!adminNote) throw new Error("Add an admin note describing the action.");

  const feedback = await prisma.doctorFeedback.findUnique({
    where: { id: input.feedbackId },
    select: { id: true, doctorProfileId: true },
  });
  if (!feedback) throw new Error("Feedback not found.");

  await prisma.$transaction([
    prisma.doctorFeedback.update({
      where: { id: feedback.id },
      data: {
        status: "RESOLVED",
        adminNote,
        reviewedByUserId: session.user.id,
        reviewedAt: new Date(),
      },
    }),
    ...(input.action === "REVOKE_APPROVAL"
      ? [
          prisma.doctorProfile.update({
            where: { id: feedback.doctorProfileId },
            data: {
              isApprovedByAdmin: false,
              approvedByAdminAt: null,
              isVerified: false,
              verifiedAt: null,
              approvalRejectedAt: new Date(),
              approvalRejectionReason: adminNote,
            },
          }),
        ]
      : []),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCTOR_FEEDBACK_REVIEWED",
        entity: "DoctorFeedback",
        entityId: feedback.id,
        description:
          input.action === "REVOKE_APPROVAL"
            ? "Administrator resolved patient feedback and revoked doctor approval."
            : "Administrator resolved patient feedback.",
        metadata: { action: input.action, doctorProfileId: feedback.doctorProfileId, adminNote },
      },
    }),
  ]);

  revalidatePath("/admin/feedback");
  revalidatePath("/admin/doctors");
  revalidatePath(`/admin/doctors/${feedback.doctorProfileId}`);
}
