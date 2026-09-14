"use server";

import { revalidatePath } from "next/cache";
import { requireDoctorAction } from "@/lib/doctor-auth";
import prisma from "@/lib/prisma";

const clean = (value?: string | null) => value?.trim() || null;

export async function updateDoctorAccount(input: {
  name: string;
  phoneNumber?: string;
  displayUsername?: string;
}) {
  const session = await requireDoctorAction();
  if (!input.name.trim()) throw new Error("Name is required.");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: input.name.trim(),
      phoneNumber: clean(input.phoneNumber),
      displayUsername: clean(input.displayUsername),
    },
  });
  revalidatePath("/doctor/profile");
}

export async function updateDoctorProfessional(input: {
  specialization?: string;
  hospitalName?: string;
  licenseNumber?: string;
}) {
  const session = await requireDoctorAction();

  const existing = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { licenseNumber: true },
  });
  await prisma.doctorProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      specialization: clean(input.specialization),
      hospitalName: clean(input.hospitalName),
      licenseNumber: clean(input.licenseNumber),
    },
    update: {
      specialization: clean(input.specialization),
      hospitalName: clean(input.hospitalName),
      licenseNumber: existing?.licenseNumber ?? clean(input.licenseNumber),
    },
  });
  revalidatePath("/doctor/profile");
}

export async function revokeDoctorSession(sessionId: string) {
  const session = await requireDoctorAction();
  if (session.session.id === sessionId) throw new Error("You cannot revoke your current session.");

  await prisma.session.deleteMany({ where: { id: sessionId, userId: session.user.id } });
  revalidatePath("/doctor/profile");
}
