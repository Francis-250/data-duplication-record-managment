import "dotenv/config";
import {
  MatchClassification,
  MatchReviewStatus,
  MatchRunStatus,
  ImportStatus,
} from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { computeStandardizedFields } from "../lib/deduplication/standardization";
import { compareRecordPair } from "../lib/deduplication/matching-engine";
import prisma from "@/lib/prisma";

const password = process.env.SEED_USER_PASSWORD ?? "University123!";

const users = {
  admin: {
    id: "seed-admin-01",
    name: "Dr. Diane Karangwa",
    email: "admin@dedup.system",
    phoneNumber: "+250788000001",
    username: "admin_system",
    displayUsername: "Dr. Karangwa",
    role: "ADMIN",
  },
  registryStaff: {
    id: "seed-registry-01",
    name: "Aimable Nkurunziza",
    email: "registry@dedup.system",
    phoneNumber: "+250788000002",
    username: "registry_staff",
    displayUsername: "A. Nkurunziza",
    role: "REGISTRY_STAFF",
  },
  student: {
    id: "seed-student-01",
    name: "Jean-Paul Habimana",
    email: "student@dedup.system",
    phoneNumber: "+250788000003",
    username: "student_user",
    displayUsername: "Jean-Paul",
    role: "STUDENT",
  },
} as const;

async function upsertUser(user: (typeof users)[keyof typeof users]) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: user.email },
        { phoneNumber: user.phoneNumber },
        { id: user.id },
      ],
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        phoneNumberVerified: true,
        username: user.username,
        displayUsername: user.displayUsername,
        role: user.role,
        emailVerified: true,
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });
  }

  return prisma.user.create({
    data: {
      ...user,
      emailVerified: true,
      phoneNumberVerified: true,
      banned: false,
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

// Student records to seed
const studentRecordsData = [
  // Pair 1: Typo in name, different registration format, different phone format (Match)
  {
    id: "rec-001a",
    recordType: "STUDENT",
    firstName: "Jean-Paul",
    middleName: null,
    lastName: "Habimana",
    fullName: "Jean-Paul Habimana",
    gender: "Male",
    dateOfBirth: new Date("1998-05-14"),
    nationalId: "1199880012345012",
    passportNumber: null,
    registrationNumber: "REG/2023/BIT/042",
    applicantNumber: "APP-2023-0104",
    email: "jp.habimana@dedup.system",
    phoneNumber: "+250788123456",
    programme: "Bachelor of Science in Information Technology",
    department: "Information Technology",
    faculty: "Faculty of Computing & Information Technology",
    campus: "Main Campus",
    intake: "September 2023",
    academicYear: "2023/2024",
    address: "Gasabo, Sector 1",
    recordSource: "Admissions Portal 2023",
    status: "ACTIVE",
    studentUserId: "seed-student-01",
  },
  {
    id: "rec-001b",
    recordType: "STUDENT",
    firstName: "Jean Paul",
    middleName: null,
    lastName: "Habimana",
    fullName: "Jean Paul Habimana",
    gender: "Male",
    dateOfBirth: new Date("1998-05-14"),
    nationalId: "1199880012345012",
    passportNumber: null,
    registrationNumber: "reg-2023-bit-042",
    applicantNumber: null,
    email: "jeanpaul.h@gmail.com",
    phoneNumber: "0788-123-456",
    programme: "Bachelor of Science in Information Technology",
    department: "Information Technology",
    faculty: "Faculty of Computing & Information Technology",
    campus: "North Campus",
    intake: "September 2023",
    academicYear: "2023/2024",
    address: "Northern District",
    recordSource: "North Campus Legacy Registry",
    status: "ACTIVE",
    studentUserId: null,
  },

  // Pair 2: Inverted name tokens & different date format (Possible Match / Match)
  {
    id: "rec-002a",
    recordType: "STUDENT",
    firstName: "Aline",
    middleName: "Mukamana",
    lastName: "Uwase",
    fullName: "Aline Mukamana Uwase",
    gender: "Female",
    dateOfBirth: new Date("2001-11-20"),
    nationalId: "1200170098765432",
    passportNumber: null,
    registrationNumber: "REG/2024/BBA/109",
    applicantNumber: "APP-2024-0551",
    email: "a.uwase@dedup.system",
    phoneNumber: "+250788234567",
    programme: "Bachelor of Business Administration",
    department: "Business Administration",
    faculty: "Faculty of Business Management & Economics",
    campus: "Main Campus",
    intake: "March 2024",
    academicYear: "2024/2025",
    address: "Kicukiro District",
    recordSource: "Main Registry Ingest",
    status: "ACTIVE",
    studentUserId: null,
  },
  {
    id: "rec-002b",
    recordType: "STUDENT",
    firstName: "Uwase",
    middleName: null,
    lastName: "Aline",
    fullName: "Uwase Aline",
    gender: "Female",
    dateOfBirth: new Date("2001-11-20"),
    nationalId: "1200170098765432",
    passportNumber: null,
    registrationNumber: "REG/2024/BBA/109",
    applicantNumber: null,
    email: "aline.uwase2001@yahoo.com",
    phoneNumber: "0788 234 567",
    programme: "Bachelor of Business Administration",
    department: "Business Administration",
    faculty: "Faculty of Business Management & Economics",
    campus: "Main Campus",
    intake: "March 2024",
    academicYear: "2024/2025",
    address: "Central District",
    recordSource: "Economics Faculty CSV Import",
    status: "ACTIVE",
    studentUserId: null,
  },

  // Pair 3: Missing National ID in one record, slight spelling difference (Possible Match)
  {
    id: "rec-003a",
    recordType: "STUDENT",
    firstName: "Eric",
    middleName: null,
    lastName: "Mugisha",
    fullName: "Eric Mugisha",
    gender: "Male",
    dateOfBirth: new Date("1999-03-10"),
    nationalId: "1199980034567890",
    passportNumber: null,
    registrationNumber: "REG/2022/BCS/088",
    applicantNumber: "APP-2022-0312",
    email: "e.mugisha@dedup.system",
    phoneNumber: "+250788345678",
    programme: "Bachelor of Science in Computer Science",
    department: "Computer Science",
    faculty: "Faculty of Computing & Information Technology",
    campus: "Main Campus",
    intake: "September 2022",
    academicYear: "2022/2023",
    address: "Nyarugenge District",
    recordSource: "Admissions 2022 Export",
    status: "ACTIVE",
    studentUserId: null,
  },
  {
    id: "rec-003b",
    recordType: "STUDENT",
    firstName: "Erik",
    middleName: null,
    lastName: "Mugisha",
    fullName: "Erik Mugisha",
    gender: "Male",
    dateOfBirth: new Date("1999-03-10"),
    nationalId: null, // missing info
    passportNumber: null,
    registrationNumber: "REG/2022/BCS/088",
    applicantNumber: null,
    email: "erikm99@gmail.com",
    phoneNumber: "+250788345678",
    programme: "Bachelor of Science in Computer Science",
    department: "Computer Science",
    faculty: "Faculty of Computing & Information Technology",
    campus: "Main Campus",
    intake: "September 2022",
    academicYear: "2022/2023",
    address: "Western District",
    recordSource: "External Exam Board Sync",
    status: "ACTIVE",
    studentUserId: null,
  },

  // Pair 4: Law Faculty Student with missing Reg Number (Match via National ID)
  {
    id: "rec-004a",
    recordType: "STUDENT",
    firstName: "Clarisse",
    middleName: null,
    lastName: "Keza",
    fullName: "Clarisse Keza",
    gender: "Female",
    dateOfBirth: new Date("2000-08-25"),
    nationalId: "1200070045678901",
    passportNumber: null,
    registrationNumber: "REG/2023/LLB/015",
    applicantNumber: "APP-2023-0870",
    email: "c.keza@dedup.system",
    phoneNumber: "+250788456789",
    programme: "Bachelor of Laws",
    department: "Law",
    faculty: "Faculty of Law",
    campus: "Main Campus",
    intake: "September 2023",
    academicYear: "2023/2024",
    address: "Eastern District",
    recordSource: "Law Faculty Database",
    status: "ACTIVE",
    studentUserId: null,
  },
  {
    id: "rec-004b",
    recordType: "STUDENT",
    firstName: "Kezah",
    middleName: "Marie",
    lastName: "Clarisse",
    fullName: "Kezah Marie Clarisse",
    gender: "Female",
    dateOfBirth: new Date("2000-08-25"),
    nationalId: "1200070045678901",
    passportNumber: null,
    registrationNumber: null,
    applicantNumber: "APP-2023-0870",
    email: "clarisse.keza@gmail.com",
    phoneNumber: "0788456789",
    programme: "Bachelor of Laws",
    department: "Law",
    faculty: "Faculty of Law",
    campus: "Main Campus",
    intake: "September 2023",
    academicYear: "2023/2024",
    address: "Southern District",
    recordSource: "Admissions Intake Sheet",
    status: "ACTIVE",
    studentUserId: null,
  },

  // Independent distinct students (Non-matches)
  {
    id: "rec-005",
    recordType: "STUDENT",
    firstName: "Patrick",
    middleName: "Kanimba",
    lastName: "Bizimana",
    fullName: "Patrick Kanimba Bizimana",
    gender: "Male",
    dateOfBirth: new Date("2002-01-18"),
    nationalId: "1200280067890123",
    passportNumber: null,
    registrationNumber: "REG/2024/BIT/301",
    applicantNumber: "APP-2024-1102",
    email: "p.bizimana@dedup.system",
    phoneNumber: "+250788567890",
    programme: "Bachelor of Science in Information Technology",
    department: "Information Technology",
    faculty: "Faculty of Computing & Information Technology",
    campus: "Main Campus",
    intake: "September 2024",
    academicYear: "2024/2025",
    address: "Southern Province",
    recordSource: "Admissions 2024",
    status: "ACTIVE",
    studentUserId: null,
  },
  {
    id: "rec-006",
    recordType: "STUDENT",
    firstName: "Sandrine",
    middleName: null,
    lastName: "Ingabire",
    fullName: "Sandrine Ingabire",
    gender: "Female",
    dateOfBirth: new Date("2001-04-12"),
    nationalId: "1200170078901234",
    passportNumber: null,
    registrationNumber: "REG/2023/BBA/412",
    applicantNumber: "APP-2023-1490",
    email: "s.ingabire@dedup.system",
    phoneNumber: "+250788678901",
    programme: "Bachelor of Business Administration",
    department: "Accounting & Finance",
    faculty: "Faculty of Business Management & Economics",
    campus: "North Campus",
    intake: "March 2023",
    academicYear: "2023/2024",
    address: "Northern Province",
    recordSource: "North Campus Registry",
    status: "ACTIVE",
    studentUserId: null,
  },
  {
    id: "rec-007",
    recordType: "STUDENT",
    firstName: "David",
    middleName: null,
    lastName: "Nsengiyumva",
    fullName: "David Nsengiyumva",
    gender: "Male",
    dateOfBirth: new Date("1997-09-30"),
    nationalId: "1199780089012345",
    passportNumber: null,
    registrationNumber: "REG/2023/MIT/009",
    applicantNumber: "APP-2023-0012",
    email: "d.nsengiyumva@dedup.system",
    phoneNumber: "+250788789012",
    programme: "Master of Science in Information Technology",
    department: "Postgraduate Studies",
    faculty: "Faculty of Computing & Information Technology",
    campus: "Main Campus",
    intake: "September 2023",
    academicYear: "2023/2024",
    address: "Capital District",
    recordSource: "Postgraduate Registry",
    status: "ACTIVE",
    studentUserId: null,
  },
];

async function main() {
  console.log("Seeding DATA DEDUPLICATION AND RECORD MATCHING SYSTEM...");

  const hashedPassword = await hashPassword(password);

  // 1. Seed Users with required role values: ADMIN, REGISTRY_STAFF, STUDENT
  const adminUser = await upsertUser(users.admin);
  const registryUser = await upsertUser(users.registryStaff);
  const studentUser = await upsertUser(users.student);

  await upsertCredential(adminUser.id, hashedPassword);
  await upsertCredential(registryUser.id, hashedPassword);
  await upsertCredential(studentUser.id, hashedPassword);

  console.log("Seeded User Accounts:");
  console.table([
    { role: adminUser.role, email: adminUser.email, password },
    { role: registryUser.role, email: registryUser.email, password },
    { role: studentUser.role, email: studentUser.email, password },
  ]);

  // 2. Seed Default Deduplication Settings
  const settings = [
    {
      key: "match_threshold",
      value: "0.80",
      description: "Definite match threshold (MATCH classification)",
    },
    {
      key: "possible_threshold",
      value: "0.52",
      description: "Possible match threshold (POSSIBLE_MATCH classification)",
    },
    {
      key: "default_algorithm",
      value: "Hybrid Fellegi-Sunter & Token Similarity",
      description: "Default matching algorithm",
    },
    {
      key: "exhaustive_threshold",
      value: "300",
      description: "Cap for exhaustive vs blocked candidate generation",
    },
    {
      key: "institution_name",
      value: "DATA DEDUPLICATION AND RECORD MATCHING SYSTEM",
      description: "Institution name",
    },
    {
      key: "primary_campus",
      value: "Main Campus",
      description: "Primary main campus",
    },
  ];

  for (const s of settings) {
    await prisma.deduplicationSetting.upsert({
      where: { key: s.key },
      create: { ...s, updatedById: adminUser.id },
      update: { value: s.value, description: s.description },
    });
  }

  // 3. Seed Dataset Import Entry
  const datasetImport = await prisma.datasetImport.upsert({
    where: { id: "seed-dataset-import-01" },
    create: {
      id: "seed-dataset-import-01",
      originalFileName: "Student_Admissions_Cohort_2024.csv",
      storedFileName: "cohort-2024-verified.csv",
      fileSize: 48120,
      mimeType: "text/csv",
      uploadedById: registryUser.id,
      status: ImportStatus.IMPORTED,
      totalRows: 120,
      validRows: 118,
      invalidRows: 1,
      duplicateRows: 1,
      importedAt: new Date(),
    },
    update: {
      status: ImportStatus.IMPORTED,
    },
  });

  // 4. Seed Institutional Student Records
  const createdRecords: any[] = [];
  for (const rec of studentRecordsData) {
    const std = computeStandardizedFields({
      firstName: rec.firstName,
      middleName: rec.middleName,
      lastName: rec.lastName,
      fullName: rec.fullName,
      email: rec.email,
      phoneNumber: rec.phoneNumber,
      registrationNumber: rec.registrationNumber,
      nationalId: rec.nationalId,
    });

    const record = await prisma.institutionalRecord.upsert({
      where: { id: rec.id },
      create: {
        ...rec,
        datasetImportId: datasetImport.id,
        submittedById: registryUser.id,
        standardizedName: std.standardizedName,
        standardizedEmail: std.standardizedEmail,
        standardizedPhone: std.standardizedPhone,
        standardizedRegistrationNumber: std.standardizedRegistrationNumber,
        standardizedNationalId: std.standardizedNationalId,
      } as any,
      update: {
        firstName: rec.firstName,
        middleName: rec.middleName,
        lastName: rec.lastName,
        fullName: rec.fullName,
        nationalId: rec.nationalId,
        registrationNumber: rec.registrationNumber,
        email: rec.email,
        phoneNumber: rec.phoneNumber,
        status: rec.status as any,
        standardizedName: std.standardizedName,
        standardizedEmail: std.standardizedEmail,
        standardizedPhone: std.standardizedPhone,
        standardizedRegistrationNumber: std.standardizedRegistrationNumber,
        standardizedNationalId: std.standardizedNationalId,
      },
    });
    createdRecords.push(record);
  }

  // 5. Seed Demonstration Match Run & Candidates
  const matchRun = await prisma.matchRun.upsert({
    where: { id: "seed-match-run-001" },
    create: {
      id: "seed-match-run-001",
      datasetImportId: datasetImport.id,
      startedById: registryUser.id,
      status: MatchRunStatus.COMPLETED,
      algorithm: "Hybrid Fellegi-Sunter & Token Similarity",
      modelVersion: "v2.4-DEDUP-ML",
      matchThreshold: 0.8,
      possibleThreshold: 0.52,
      recordsProcessed: createdRecords.length,
      candidatePairs: 12,
      matchesFound: 3,
      possibleMatches: 1,
      nonMatches: 8,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
    },
    update: {
      status: MatchRunStatus.COMPLETED,
    },
  });

  // Evaluate and seed candidate pair 1: Jean-Paul Habimana
  const rec1a = createdRecords.find((r) => r.id === "rec-001a")!;
  const rec1b = createdRecords.find((r) => r.id === "rec-001b")!;
  const eval1 = compareRecordPair(rec1a, rec1b);

  const cand1 = await prisma.matchCandidate.upsert({
    where: {
      matchRunId_recordAId_recordBId: {
        matchRunId: matchRun.id,
        recordAId: rec1a.id,
        recordBId: rec1b.id,
      },
    },
    create: {
      matchRunId: matchRun.id,
      recordAId: rec1a.id,
      recordBId: rec1b.id,
      overallScore: eval1.overallScore,
      confidenceScore: eval1.confidenceScore,
      classification: eval1.classification,
      reviewStatus: MatchReviewStatus.CONFIRMED,
      explanation: eval1.explanation,
      algorithm: eval1.algorithm,
      modelVersion: eval1.modelVersion,
      reviewedById: registryUser.id,
      reviewedAt: new Date(),
      reviewNote:
        "Confirmed: Student registered on main admissions and North Campus registry with slight spelling variation.",
      fieldComparisons: {
        create: eval1.fieldComparisons.map((fc) => ({
          fieldName: fc.fieldName,
          recordAValue: fc.recordAValue,
          recordBValue: fc.recordBValue,
          standardizedA: fc.standardizedA,
          standardizedB: fc.standardizedB,
          similarityMethod: fc.similarityMethod,
          similarityScore: fc.similarityScore,
          isExactMatch: fc.isExactMatch,
        })),
      },
    },
    update: {
      overallScore: eval1.overallScore,
      reviewStatus: MatchReviewStatus.CONFIRMED,
    },
  });

  // Evaluate and seed candidate pair 2: Aline Uwase Mukamana (Pre-merged to demonstrate merge history!)
  const rec2a = createdRecords.find((r) => r.id === "rec-002a")!;
  const rec2b = createdRecords.find((r) => r.id === "rec-002b")!;
  const eval2 = compareRecordPair(rec2a, rec2b);

  const cand2 = await prisma.matchCandidate.upsert({
    where: {
      matchRunId_recordAId_recordBId: {
        matchRunId: matchRun.id,
        recordAId: rec2a.id,
        recordBId: rec2b.id,
      },
    },
    create: {
      matchRunId: matchRun.id,
      recordAId: rec2a.id,
      recordBId: rec2b.id,
      overallScore: eval2.overallScore,
      confidenceScore: eval2.confidenceScore,
      classification: eval2.classification,
      reviewStatus: MatchReviewStatus.MERGED,
      explanation: eval2.explanation,
      algorithm: eval2.algorithm,
      modelVersion: eval2.modelVersion,
      reviewedById: registryUser.id,
      reviewedAt: new Date(),
      reviewNote: "Confirmed identical student and merged into master record.",
      fieldComparisons: {
        create: eval2.fieldComparisons.map((fc) => ({
          fieldName: fc.fieldName,
          recordAValue: fc.recordAValue,
          recordBValue: fc.recordBValue,
          standardizedA: fc.standardizedA,
          standardizedB: fc.standardizedB,
          similarityMethod: fc.similarityMethod,
          similarityScore: fc.similarityScore,
          isExactMatch: fc.isExactMatch,
        })),
      },
    },
    update: {
      reviewStatus: MatchReviewStatus.MERGED,
    },
  });

  // Update record 2b as MERGED into 2a
  await prisma.institutionalRecord.update({
    where: { id: rec2b.id },
    data: {
      status: "MERGED",
      mergedIntoId: rec2a.id,
      mergedAt: new Date(),
    },
  });

  // Create demonstration RecordMerge entry
  await prisma.recordMerge.upsert({
    where: { matchCandidateId: cand2.id },
    create: {
      matchCandidateId: cand2.id,
      masterRecordId: rec2a.id,
      sourceRecordId: rec2b.id,
      mergedById: registryUser.id,
      selectedValues: {
        fullName: rec2a.fullName,
        firstName: rec2a.firstName,
        middleName: rec2a.middleName,
        lastName: rec2a.lastName,
        registrationNumber: rec2a.registrationNumber,
        nationalId: rec2a.nationalId,
        email: rec2a.email,
        phoneNumber: rec2a.phoneNumber,
        programme: rec2a.programme,
        campus: rec2a.campus,
      },
      mergeReason:
        "Confirmed duplicate entries from Economics Faculty import consolidated into master record.",
      mergedAt: new Date(),
    },
    update: {},
  });

  // Evaluate candidate pair 3: Eric Mugisha (Pending Review)
  const rec3a = createdRecords.find((r) => r.id === "rec-003a")!;
  const rec3b = createdRecords.find((r) => r.id === "rec-003b")!;
  const eval3 = compareRecordPair(rec3a, rec3b);

  await prisma.matchCandidate.upsert({
    where: {
      matchRunId_recordAId_recordBId: {
        matchRunId: matchRun.id,
        recordAId: rec3a.id,
        recordBId: rec3b.id,
      },
    },
    create: {
      matchRunId: matchRun.id,
      recordAId: rec3a.id,
      recordBId: rec3b.id,
      overallScore: eval3.overallScore,
      confidenceScore: eval3.confidenceScore,
      classification: eval3.classification,
      reviewStatus: MatchReviewStatus.PENDING,
      explanation: eval3.explanation,
      algorithm: eval3.algorithm,
      modelVersion: eval3.modelVersion,
      fieldComparisons: {
        create: eval3.fieldComparisons.map((fc) => ({
          fieldName: fc.fieldName,
          recordAValue: fc.recordAValue,
          recordBValue: fc.recordBValue,
          standardizedA: fc.standardizedA,
          standardizedB: fc.standardizedB,
          similarityMethod: fc.similarityMethod,
          similarityScore: fc.similarityScore,
          isExactMatch: fc.isExactMatch,
        })),
      },
    },
    update: {},
  });

  // Evaluate candidate pair 4: Clarisse Keza (Pending Review)
  const rec4a = createdRecords.find((r) => r.id === "rec-004a")!;
  const rec4b = createdRecords.find((r) => r.id === "rec-004b")!;
  const eval4 = compareRecordPair(rec4a, rec4b);

  await prisma.matchCandidate.upsert({
    where: {
      matchRunId_recordAId_recordBId: {
        matchRunId: matchRun.id,
        recordAId: rec4a.id,
        recordBId: rec4b.id,
      },
    },
    create: {
      matchRunId: matchRun.id,
      recordAId: rec4a.id,
      recordBId: rec4b.id,
      overallScore: eval4.overallScore,
      confidenceScore: eval4.confidenceScore,
      classification: eval4.classification,
      reviewStatus: MatchReviewStatus.PENDING,
      explanation: eval4.explanation,
      algorithm: eval4.algorithm,
      modelVersion: eval4.modelVersion,
      fieldComparisons: {
        create: eval4.fieldComparisons.map((fc) => ({
          fieldName: fc.fieldName,
          recordAValue: fc.recordAValue,
          recordBValue: fc.recordBValue,
          standardizedA: fc.standardizedA,
          standardizedB: fc.standardizedB,
          similarityMethod: fc.similarityMethod,
          similarityScore: fc.similarityScore,
          isExactMatch: fc.isExactMatch,
        })),
      },
    },
    update: {},
  });

  // 6. Seed Audit Logs
  const auditLogs = [
    {
      actorUserId: adminUser.id,
      action: "SYSTEM_SETTING_CHANGES",
      entityType: "DeduplicationSetting",
      description:
        "Administrator configured initial match thresholds (Match: 0.80, Possible: 0.52).",
    },
    {
      actorUserId: registryUser.id,
      action: "DATASET_IMPORT",
      entityType: "DatasetImport",
      entityId: datasetImport.id,
      description:
        "Registry staff uploaded cohort CSV 'Student_Admissions_Cohort_2024.csv'.",
    },
    {
      actorUserId: registryUser.id,
      action: "DEDUPLICATION_EXECUTION",
      entityType: "MatchRun",
      entityId: matchRun.id,
      description:
        "Registry staff executed deduplication pipeline across 9 student records.",
    },
    {
      actorUserId: registryUser.id,
      action: "MATCH_CONFIRMATION",
      entityType: "MatchCandidate",
      entityId: cand1.id,
      description:
        "Registry staff confirmed match pair between 'Jean-Paul Habimana' and 'Jean Paul Habimana'.",
    },
    {
      actorUserId: registryUser.id,
      action: "RECORD_MERGING",
      entityType: "RecordMerge",
      description:
        "Registry staff merged duplicate record 'Uwase Aline' into master record 'Aline Mukamana Uwase'.",
    },
  ];

  for (const log of auditLogs) {
    await prisma.deduplicationAuditLog.create({
      data: log,
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((error) => {
    console.error("Seed Error message:", error?.message);
    console.error("Seed Error stack:", error?.stack);
    console.error(
      "Seed Error full:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
