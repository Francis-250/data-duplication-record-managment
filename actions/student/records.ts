"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireStudentAction } from "@/lib/student-auth";
import { computeStandardizedFields, standardizeDate } from "@/lib/deduplication/standardization";
import { recordDeduplicationAudit } from "@/lib/deduplication/audit";
import { compareRecordPair } from "@/lib/deduplication/matching-engine";
import { MatchClassification } from "@prisma/client";

export interface SubmitStudentRecordInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  nationalId?: string;
  passportNumber?: string;
  registrationNumber?: string;
  applicantNumber?: string;
  email?: string;
  phoneNumber?: string;
  programme?: string;
  department?: string;
  faculty?: string;
  campus?: string;
  intake?: string;
  academicYear?: string;
  address?: string;
}

export async function submitStudentRecord(input: SubmitStudentRecordInput) {
  const session = await requireStudentAction();

  if (!input.firstName.trim() || !input.lastName.trim()) {
    throw new Error("First name and Last name are required.");
  }

  const fullName = [input.firstName.trim(), input.middleName?.trim(), input.lastName.trim()]
    .filter(Boolean)
    .join(" ");

  const std = computeStandardizedFields({
    firstName: input.firstName,
    middleName: input.middleName,
    lastName: input.lastName,
    fullName,
    email: input.email,
    phoneNumber: input.phoneNumber,
    registrationNumber: input.registrationNumber,
    nationalId: input.nationalId,
  });

  const parsedDob = input.dateOfBirth ? standardizeDate(input.dateOfBirth).date : null;

  const record = await prisma.institutionalRecord.create({
    data: {
      recordType: "STUDENT",
      firstName: input.firstName.trim(),
      middleName: input.middleName?.trim() || null,
      lastName: input.lastName.trim(),
      fullName,
      gender: input.gender || null,
      dateOfBirth: parsedDob,
      nationalId: input.nationalId?.trim() || null,
      passportNumber: input.passportNumber?.trim() || null,
      registrationNumber: input.registrationNumber?.trim() || null,
      applicantNumber: input.applicantNumber?.trim() || null,
      email: input.email?.trim() || null,
      phoneNumber: input.phoneNumber?.trim() || null,
      programme: input.programme || null,
      department: input.department || null,
      faculty: input.faculty || null,
      campus: input.campus || "Main Campus",
      intake: input.intake || null,
      academicYear: input.academicYear || "2024/2025",
      address: input.address || null,
      recordSource: "Student Portal Self-Submission",
      status: "ACTIVE",
      studentUserId: session.user.id,
      submittedById: session.user.id,
      standardizedName: std.standardizedName,
      standardizedEmail: std.standardizedEmail,
      standardizedPhone: std.standardizedPhone,
      standardizedRegistrationNumber: std.standardizedRegistrationNumber,
      standardizedNationalId: std.standardizedNationalId,
    },
  });

  await recordDeduplicationAudit({
    actorUserId: session.user.id,
    action: "RECORD_SUBMISSION",
    entityType: "InstitutionalRecord",
    entityId: record.id,
    description: `Student '${session.user.name}' submitted institutional student record for '${fullName}'.`,
    metadata: {
      recordId: record.id,
      registrationNumber: record.registrationNumber,
      fullName: record.fullName,
    },
  });

  revalidatePath("/student");
  return record;
}

export async function getMyStudentRecords() {
  const session = await requireStudentAction();

  return prisma.institutionalRecord.findMany({
    where: {
      OR: [
        { studentUserId: session.user.id },
        { submittedById: session.user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Privacy-safe public directory search for students:
 * Minimum necessary data exposure (displays basic verification details, hides private personal contact info)
 */
export async function searchAllowedRecords(query: string) {
  await requireStudentAction();

  const q = query.trim();
  if (!q || q.length < 2) return [];

  const results = await prisma.institutionalRecord.findMany({
    where: {
      status: { not: "ARCHIVED" },
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { registrationNumber: { contains: q, mode: "insensitive" } },
        { programme: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 20,
    select: {
      id: true,
      fullName: true,
      registrationNumber: true,
      programme: true,
      campus: true,
      academicYear: true,
      status: true,
      createdAt: true,
    },
  });

  return results;
}

export interface CheckDuplicateParams {
  registrationNumber?: string;
  nationalId?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

export async function checkStudentPotentialDuplicate(params: CheckDuplicateParams) {
  await requireStudentAction();

  const conditions: any[] = [];

  if (params.registrationNumber?.trim()) {
    conditions.push({ registrationNumber: { contains: params.registrationNumber.trim(), mode: "insensitive" } });
  }
  if (params.nationalId?.trim()) {
    conditions.push({ nationalId: { contains: params.nationalId.trim(), mode: "insensitive" } });
  }
  if (params.lastName?.trim() && params.firstName?.trim()) {
    conditions.push({
      AND: [
        { firstName: { contains: params.firstName.trim(), mode: "insensitive" } },
        { lastName: { contains: params.lastName.trim(), mode: "insensitive" } },
      ],
    });
  }

  if (conditions.length === 0) {
    return { potentialDuplicates: [], hasHighRiskDuplicate: false };
  }

  const existingRecords = await prisma.institutionalRecord.findMany({
    where: {
      status: { in: ["ACTIVE", "MERGED"] },
      OR: conditions,
    },
    take: 10,
    select: {
      id: true,
      fullName: true,
      registrationNumber: true,
      programme: true,
      campus: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    potentialDuplicates: existingRecords,
    hasHighRiskDuplicate: existingRecords.length > 0,
  };
}
