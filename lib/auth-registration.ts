import { createHmac, timingSafeEqual } from "node:crypto";
import { roleHome } from "@/lib/auth-routing";
import prisma from "@/lib/prisma";

type DoctorIntent = {
  email: string;
  role: "doctor";
  expiresAt: number;
};

const secret = () => {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("Authentication secret is not configured.");
  return value;
};

const sign = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("base64url");

function parseDoctorIntent(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new Error("Invalid doctor registration.");

  const expected = sign(encoded);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid doctor registration.");
  }

  const intent = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8"),
  ) as DoctorIntent;
  if (intent.role !== "doctor" || intent.expiresAt < Date.now()) {
    throw new Error("Doctor registration has expired. Please register again.");
  }
  return intent;
}

export function createDoctorRegistrationIntent(email: string) {
  const intent: DoctorIntent = {
    email: email.trim().toLowerCase(),
    role: "doctor",
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(intent)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export async function startDoctorRegistration(emailInput: string, token: string) {
  const intent = parseDoctorIntent(token);
  const email = emailInput.trim().toLowerCase();
  if (intent.email !== email) throw new Error("Registration email does not match.");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, emailVerified: true },
  });
  if (!user) throw new Error("Create your account before continuing.");
  if (user.role?.toLowerCase() === "admin") throw new Error("Invalid account role.");
  if (user.emailVerified && user.role?.toLowerCase() !== "doctor") {
    throw new Error("This verified account cannot be converted to a doctor account.");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: "doctor" } }),
    prisma.doctorProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    }),
  ]);
}

export async function completeDoctorRegistration(input: {
  token: string;
  email: string;
  specialization: string;
  hospitalName: string;
  licenseNumber: string;
  phoneNumber: string;
}) {
  const intent = parseDoctorIntent(input.token);
  const email = input.email.trim().toLowerCase();
  if (intent.email !== email) throw new Error("Registration email does not match.");

  const specialization = input.specialization.trim();
  const hospitalName = input.hospitalName.trim();
  const licenseNumber = input.licenseNumber.trim();
  const phoneNumber = input.phoneNumber.trim();
  if (!specialization || !hospitalName || !licenseNumber || !phoneNumber) {
    throw new Error("Complete every required professional field.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      emailVerified: true,
      role: true,
      doctorProfile: { select: { licenseNumber: true } },
    },
  });
  if (!user?.emailVerified) throw new Error("Verify your email before continuing.");
  if (user.role?.toLowerCase() !== "doctor") throw new Error("Invalid account role.");
  if (user.doctorProfile?.licenseNumber) {
    throw new Error("Your doctor profile has already been submitted.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { phoneNumber },
    }),
    prisma.doctorProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        specialization,
        hospitalName,
        licenseNumber,
        isVerified: false,
        isApprovedByAdmin: false,
      },
      update: {
        specialization,
        hospitalName,
        licenseNumber,
        isVerified: false,
        verifiedAt: null,
        isApprovedByAdmin: false,
        approvedByAdminAt: null,
        approvalRejectedAt: null,
        approvalRejectionReason: null,
      },
    }),
  ]);
}

export async function getPostLoginDestination(user: {
  id: string;
  role?: string | null;
}) {
  if (user.role?.toLowerCase() !== "doctor") {
    return {
      destination: roleHome(user.role),
      blocked: false,
      reason: null,
    };
  }

  const profile = await prisma.doctorProfile.findUnique({
    where: { userId: user.id },
    select: {
      specialization: true,
      hospitalName: true,
      licenseNumber: true,
      isApprovedByAdmin: true,
      approvalRejectedAt: true,
      approvalRejectionReason: true,
    },
  });
  const complete =
    !!profile?.specialization && !!profile.hospitalName && !!profile.licenseNumber;
  const approved = complete && profile.isApprovedByAdmin;

  const reason = profile?.approvalRejectedAt
    ? `Your doctor application was rejected: ${profile.approvalRejectionReason ?? "No reason provided."}`
    : "Your doctor account is waiting for administrator approval.";

  return {
    destination: approved
      ? "/doctor"
      : `/auth/doctor-pending?reason=${encodeURIComponent(reason)}`,
    blocked: !approved,
    reason,
  };
}
