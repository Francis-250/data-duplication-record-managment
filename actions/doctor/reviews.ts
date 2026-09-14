"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireDoctorAction } from "@/lib/doctor-auth";
import prisma from "@/lib/prisma";

export async function addDoctorComment(input: {
  assessmentId: string;
  comment: string;
  isUrgent: boolean;
}) {
  const session = await requireDoctorAction();

  const comment = input.comment.trim();
  if (!comment) throw new Error("Comment is required.");

  const [doctor, assessment] = await Promise.all([
    prisma.doctorProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.assessment.findUnique({
      where: { id: input.assessmentId },
      select: {
        id: true,
        userId: true,
        doctorAssignment: { select: { doctorProfileId: true } },
      },
    }),
  ]);
  if (!doctor) throw new Error("Complete your doctor profile before reviewing assessments.");
  if (!assessment) throw new Error("Assessment not found.");
  if (assessment.doctorAssignment?.doctorProfileId !== doctor.id) {
    throw new Error("This assessment is not assigned to you.");
  }

  const requestHeaders = await headers();
  await prisma.$transaction([
    prisma.doctorComment.create({
      data: {
        assessmentId: assessment.id,
        doctorProfileId: doctor.id,
        comment,
        isUrgent: input.isUrgent,
      },
    }),
    prisma.assessment.update({
      where: { id: assessment.id },
      data: { reviewedByDoctor: true, reviewedAt: new Date(), status: "REVIEWED" },
    }),
    prisma.notification.create({
      data: {
        userId: assessment.userId,
        assessmentId: assessment.id,
        type: "DOCTOR_COMMENT",
        title: input.isUrgent ? "Urgent doctor comment" : "Doctor comment added",
        message: comment,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCTOR_COMMENT_ADDED",
        entity: "Assessment",
        entityId: assessment.id,
        description: "Doctor added a comment to an assessment.",
        metadata: { isUrgent: input.isUrgent },
        ipAddress: requestHeaders.get("x-forwarded-for"),
        userAgent: requestHeaders.get("user-agent"),
      },
    }),
  ]);

  revalidatePath("/doctor");
  revalidatePath("/doctor/reviews");
  revalidatePath(`/doctor/reviews/${assessment.id}`);
  revalidatePath(`/patient/assessment/${assessment.id}`);
  revalidatePath("/patient/notifications");
}
