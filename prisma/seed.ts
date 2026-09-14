import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const password = process.env.SEED_USER_PASSWORD ?? "StrokeCheck123!";

const users = {
  admin: {
    id: "seed-admin",
    name: "Amara Williams",
    email: "admin@strokecheck.test",
    phoneNumber: "+250788000001",
    username: "admin",
    displayUsername: "Amara",
    role: "admin",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
  },
  doctor: {
    id: "seed-doctor",
    name: "Dr. Daniel Carter",
    email: "doctor@strokecheck.test",
    phoneNumber: "+250788000002",
    username: "doctor",
    displayUsername: "Dr. Carter",
    role: "doctor",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=256&q=80",
  },
  patient: {
    id: "seed-patient",
    name: "Maya Thompson",
    email: "patient@strokecheck.test",
    phoneNumber: "+250788000003",
    username: "patient",
    displayUsername: "Maya",
    role: "patient",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=256&q=80",
  },
} as const;

async function upsertUser(user: (typeof users)[keyof typeof users]) {
  return prisma.user.upsert({
    where: { email: user.email },
    create: {
      ...user,
      emailVerified: true,
      phoneNumberVerified: true,
      banned: false,
      twoFactorEnabled: false,
    },
    update: {
      name: user.name,
      image: user.image,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: true,
      username: user.username,
      displayUsername: user.displayUsername,
      role: user.role,
      emailVerified: true,
      banned: false,
      banReason: null,
      banExpires: null,
      twoFactorEnabled: false,
    },
  });
}

async function upsertCredential(userId: string, hashedPassword: string) {
  const existing = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        accountId: userId,
        password: hashedPassword,
      },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: `seed-credential-${userId}`,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    },
  });
}

async function main() {
  const hashedPassword = await hashPassword(password);
  const [admin, doctor, patient] = await Promise.all([
    upsertUser(users.admin),
    upsertUser(users.doctor),
    upsertUser(users.patient),
  ]);

  await Promise.all([
    upsertCredential(admin.id, hashedPassword),
    upsertCredential(doctor.id, hashedPassword),
    upsertCredential(patient.id, hashedPassword),
    prisma.doctorProfile.upsert({
      where: { userId: doctor.id },
      create: {
        userId: doctor.id,
        specialization: "Neurology",
        hospitalName: "King Faisal Hospital Rwanda",
        licenseNumber: "RMC-NEURO-2026-001",
        isVerified: true,
        verifiedAt: new Date(),
        isApprovedByAdmin: true,
        approvedByAdminAt: new Date(),
      },
      update: {
        specialization: "Neurology",
        hospitalName: "King Faisal Hospital Rwanda",
        licenseNumber: "RMC-NEURO-2026-001",
        isVerified: true,
        verifiedAt: new Date(),
        isApprovedByAdmin: true,
        approvedByAdminAt: new Date(),
        approvalRejectedAt: null,
        approvalRejectionReason: null,
      },
    }),
    prisma.patientProfile.upsert({
      where: { userId: patient.id },
      create: {
        userId: patient.id,
        age: 42,
        gender: "Female",
        bloodType: "O+",
        allergies: "Penicillin",
        existingConditions: "Migraine",
        smokingStatus: false,
        diabetic: false,
        hypertension: true,
        heartDisease: false,
      },
      update: {
        age: 42,
        gender: "Female",
        bloodType: "O+",
        allergies: "Penicillin",
        existingConditions: "Migraine",
        smokingStatus: false,
        diabetic: false,
        hypertension: true,
        heartDisease: false,
      },
    }),
  ]);

  console.log("Seeded verified login accounts:");
  console.table([
    { role: "admin", email: admin.email, password },
    { role: "doctor", email: doctor.email, password },
    { role: "patient", email: patient.email, password },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
