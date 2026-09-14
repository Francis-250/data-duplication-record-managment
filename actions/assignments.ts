"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import { requirePatientAction } from "@/lib/patient-auth";
import prisma from "@/lib/prisma";

async function assignDoctor(input: {
  assessmentId: string;
  doctorProfileId: string;
  actorUserId: string;
  source: "PATIENT" | "ADMIN";
  patientUserId?: string;
}) {
  const [assessment, doctor] = await Promise.all([
    prisma.assessment.findUnique({
      where: { id: input.assessmentId },
      select: {
        id: true,
        userId: true,
        riskLevel: true,
        doctorAssignment: { select: { doctorProfileId: true } },
      },
    }),
    prisma.doctorProfile.findUnique({
      where: { id: input.doctorProfileId },
      select: {
        id: true,
        isApprovedByAdmin: true,
        isVerified: true,
        userId: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  if (!assessment) throw new Error("Assessment not found.");
  if (input.patientUserId && assessment.userId !== input.patientUserId) {
    throw new Error("You can only assign a doctor to your own assessment.");
  }
  if (!doctor?.isApprovedByAdmin || !doctor.isVerified) {
    throw new Error("Select an approved and verified doctor.");
  }
  const doctorChanged =
    assessment.doctorAssignment?.doctorProfileId &&
    assessment.doctorAssignment.doctorProfileId !== doctor.id;

  await prisma.$transaction([
    prisma.patientDoctorAssignment.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        patientUserId: assessment.userId,
        doctorProfileId: doctor.id,
        assignedByUserId: input.actorUserId,
        source: input.source,
      },
      update: {
        doctorProfileId: doctor.id,
        assignedByUserId: input.actorUserId,
        source: input.source,
      },
    }),
    ...(doctorChanged
      ? [
          prisma.assessment.update({
            where: { id: assessment.id },
            data: {
              reviewedByDoctor: false,
              reviewedAt: null,
              status: assessment.riskLevel === "HIGH" ? "FLAGGED" : "COMPLETED",
            },
          }),
        ]
      : []),
    prisma.notification.create({
      data: {
        userId: doctor.userId,
        assessmentId: assessment.id,
        type: "DOCTOR_ASSIGNED",
        title: "New assessment assigned",
        message: `An assessment was assigned to ${doctor.user.name}.`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: assessment.userId,
        assessmentId: assessment.id,
        type: "DOCTOR_ASSIGNED",
        title: "Doctor assigned",
        message: `${doctor.user.name} was assigned to review your assessment.`,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: input.actorUserId,
        action: "ASSESSMENT_ASSIGNED",
        entity: "Assessment",
        entityId: assessment.id,
        description: `${input.source === "ADMIN" ? "Administrator" : "Patient"} assigned an assessment to ${doctor.user.name}.`,
        metadata: { doctorProfileId: doctor.id, source: input.source },
      },
    }),
  ]);

  revalidatePath("/doctor");
  revalidatePath("/doctor/reviews");
  revalidatePath("/admin/assessments");
  revalidatePath(`/patient/assessment/${assessment.id}`);
}

export async function patientAssignDoctor(input: {
  assessmentId: string;
  doctorProfileId: string;
}) {
  const session = await requirePatientAction();
  await assignDoctor({
    ...input,
    actorUserId: session.user.id,
    patientUserId: session.user.id,
    source: "PATIENT",
  });
}

export async function adminAssignDoctor(input: {
  assessmentId: string;
  doctorProfileId: string;
}) {
  const session = await requireAdminAction();
  await assignDoctor({
    ...input,
    actorUserId: session.user.id,
    source: "ADMIN",
  });
}
