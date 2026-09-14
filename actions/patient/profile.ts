"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/hooks/get-server-session";
import prisma from "@/lib/prisma";

type AccountInput = {
  name: string;
  displayUsername?: string;
  phoneNumber?: string;
};

type MedicalInput = {
  age?: number | null;
  gender?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  existingConditions?: string | null;
  smokingStatus: boolean;
  diabetic: boolean;
  hypertension: boolean;
  heartDisease: boolean;
};

const cleanOptional = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export async function updatePatientAccount(input: AccountInput) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("Name is required.");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      displayUsername: cleanOptional(input.displayUsername),
      phoneNumber: cleanOptional(input.phoneNumber),
    },
  });

  revalidatePath("/patient/profile");
}

export async function updatePatientMedicalProfile(input: MedicalInput) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await prisma.patientProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      age: input.age ?? null,
      gender: cleanOptional(input.gender),
      bloodType: cleanOptional(input.bloodType),
      allergies: cleanOptional(input.allergies),
      existingConditions: cleanOptional(input.existingConditions),
      smokingStatus: input.smokingStatus,
      diabetic: input.diabetic,
      hypertension: input.hypertension,
      heartDisease: input.heartDisease,
    },
    update: {
      age: input.age ?? null,
      gender: cleanOptional(input.gender),
      bloodType: cleanOptional(input.bloodType),
      allergies: cleanOptional(input.allergies),
      existingConditions: cleanOptional(input.existingConditions),
      smokingStatus: input.smokingStatus,
      diabetic: input.diabetic,
      hypertension: input.hypertension,
      heartDisease: input.heartDisease,
    },
  });

  revalidatePath("/patient/profile");
}

export async function revokePatientSession(sessionId: string) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.session?.id === sessionId) {
    throw new Error("You cannot revoke your current session here.");
  }

  await prisma.session.deleteMany({
    where: {
      id: sessionId,
      userId: session.user.id,
    },
  });

  revalidatePath("/patient/profile");
}
