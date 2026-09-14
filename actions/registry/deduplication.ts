"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRegistryAction } from "@/lib/registry-auth";
import { generateCandidatePairs } from "@/lib/deduplication/blocking";
import { compareRecordPair } from "@/lib/deduplication/matching-engine";
import { recordDeduplicationAudit } from "@/lib/deduplication/audit";
import { MatchClassification, MatchReviewStatus, MatchRunStatus, Prisma } from "@prisma/client";
import { analyzeRecordPairWithAi, suggestMergePreservationWithAi } from "@/lib/ai";

export interface RunDeduplicationParams {
  datasetImportId?: string;
  algorithm?: string;
  matchThreshold?: number;
  possibleThreshold?: number;
}

export async function runDeduplicationPipeline(params: RunDeduplicationParams = {}) {
  const session = await requireRegistryAction();

  const algorithm = params.algorithm || "Hybrid Fellegi-Sunter & Token Similarity";
  const matchThreshold = params.matchThreshold ?? 0.80;
  const possibleThreshold = params.possibleThreshold ?? 0.52;

  // Retrieve active records
  const whereClause: Prisma.InstitutionalRecordWhereInput = {
    status: { in: ["ACTIVE", "INACTIVE"] },
  };
  if (params.datasetImportId) {
    whereClause.datasetImportId = params.datasetImportId;
  }

  const records = await prisma.institutionalRecord.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  if (records.length < 2) {
    throw new Error("At least 2 active records are required to run deduplication.");
  }

  // Create MatchRun in PENDING state
  const matchRun = await prisma.matchRun.create({
    data: {
      datasetImportId: params.datasetImportId || null,
      startedById: session.user.id,
      status: MatchRunStatus.PROCESSING,
      algorithm,
      modelVersion: "v2.4-UOK-ML",
      matchThreshold,
      possibleThreshold,
      startedAt: new Date(),
    },
  });

  try {
    // Generate Candidate Pairs using Blocking
    const candidatePairs = generateCandidatePairs(records);

    let matchesFound = 0;
    let possibleMatches = 0;
    let nonMatches = 0;

    // Evaluate candidates
    const candidatePayloads: any[] = [];

    for (const pair of candidatePairs) {
      const evaluation = compareRecordPair(pair.recordA, pair.recordB, {
        matchThreshold,
        possibleThreshold,
        algorithm,
      });

      if (evaluation.classification === MatchClassification.MATCH) {
        matchesFound++;
      } else if (evaluation.classification === MatchClassification.POSSIBLE_MATCH) {
        possibleMatches++;
      } else {
        nonMatches++;
      }

      // Store MATCH and POSSIBLE_MATCH candidates for Registry review
      if (evaluation.classification !== MatchClassification.NON_MATCH) {
        candidatePayloads.push(evaluation);
      }
    }

    // Persist Candidates and Field Comparisons in chunks
    const CHUNK_SIZE = 25;
    for (let i = 0; i < candidatePayloads.length; i += CHUNK_SIZE) {
      const chunk = candidatePayloads.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((item) =>
          prisma.matchCandidate.create({
            data: {
              matchRunId: matchRun.id,
              recordAId: item.recordAId,
              recordBId: item.recordBId,
              overallScore: item.overallScore,
              confidenceScore: item.confidenceScore,
              classification: item.classification,
              reviewStatus: MatchReviewStatus.PENDING,
              explanation: item.explanation,
              algorithm: item.algorithm,
              modelVersion: item.modelVersion,
              fieldComparisons: {
                create: item.fieldComparisons.map((fc: any) => ({
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
          })
        )
      );
    }

    // Mark MatchRun as COMPLETED
    await prisma.matchRun.update({
      where: { id: matchRun.id },
      data: {
        status: MatchRunStatus.COMPLETED,
        recordsProcessed: records.length,
        candidatePairs: candidatePairs.length,
        matchesFound,
        possibleMatches,
        nonMatches,
        completedAt: new Date(),
      },
    });

    await recordDeduplicationAudit({
      actorUserId: session.user.id,
      action: "DEDUPLICATION_EXECUTION",
      entityType: "MatchRun",
      entityId: matchRun.id,
      description: `Executed deduplication algorithm '${algorithm}' across ${records.length} records: Found ${matchesFound} matches, ${possibleMatches} possible matches, ${nonMatches} non-matches from ${candidatePairs.length} candidate pairs.`,
      metadata: {
        matchRunId: matchRun.id,
        recordsProcessed: records.length,
        candidatePairs: candidatePairs.length,
        matchesFound,
        possibleMatches,
        nonMatches,
      },
    });

    revalidatePath("/registry");
    revalidatePath("/registry/reviews");
    revalidatePath("/registry/deduplication");
    revalidatePath("/admin");

    return {
      success: true,
      matchRunId: matchRun.id,
      recordsProcessed: records.length,
      candidatePairs: candidatePairs.length,
      matchesFound,
      possibleMatches,
      nonMatches,
    };
  } catch (error: any) {
    console.error("[Deduplication Pipeline Error]:", error);
    await prisma.matchRun.update({
      where: { id: matchRun.id },
      data: {
        status: MatchRunStatus.FAILED,
        errorMessage: error?.message || "Deduplication processing failed.",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

export interface GetMatchCandidatesFilters {
  query?: string;
  classification?: MatchClassification | "ALL";
  reviewStatus?: MatchReviewStatus | "ALL";
  page?: number;
  pageSize?: number;
}

export async function getMatchCandidates(filters: GetMatchCandidatesFilters = {}) {
  await requireRegistryAction();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 15));
  const skip = (page - 1) * pageSize;

  const where: Prisma.MatchCandidateWhereInput = {};

  if (filters.classification && filters.classification !== "ALL") {
    where.classification = filters.classification;
  }

  if (filters.reviewStatus && filters.reviewStatus !== "ALL") {
    where.reviewStatus = filters.reviewStatus;
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim();
    where.OR = [
      { recordA: { fullName: { contains: q, mode: "insensitive" } } },
      { recordB: { fullName: { contains: q, mode: "insensitive" } } },
      { recordA: { registrationNumber: { contains: q, mode: "insensitive" } } },
      { recordB: { registrationNumber: { contains: q, mode: "insensitive" } } },
      { recordA: { nationalId: { contains: q, mode: "insensitive" } } },
      { recordB: { nationalId: { contains: q, mode: "insensitive" } } },
      { explanation: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.matchCandidate.count({ where }),
    prisma.matchCandidate.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ overallScore: "desc" }, { createdAt: "desc" }],
      include: {
        recordA: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            nationalId: true,
            programme: true,
            campus: true,
            recordSource: true,
            status: true,
          },
        },
        recordB: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            nationalId: true,
            programme: true,
            campus: true,
            recordSource: true,
            status: true,
          },
        },
        _count: { select: { fieldComparisons: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getMatchCandidateDetail(candidateId: string) {
  await requireRegistryAction();

  const candidate = await prisma.matchCandidate.findUnique({
    where: { id: candidateId },
    include: {
      recordA: true,
      recordB: true,
      fieldComparisons: {
        orderBy: { similarityScore: "desc" },
      },
      matchRun: {
        select: {
          algorithm: true,
          modelVersion: true,
          matchThreshold: true,
          possibleThreshold: true,
          createdAt: true,
        },
      },
      merge: true,
    },
  });

  if (!candidate) {
    throw new Error("Match candidate pair not found.");
  }

  return candidate;
}

export async function reviewMatchCandidate(
  candidateId: string,
  decision: "CONFIRMED" | "REJECTED",
  reviewNote?: string
) {
  const session = await requireRegistryAction();

  const candidate = await prisma.matchCandidate.findUnique({
    where: { id: candidateId },
    include: {
      recordA: { select: { fullName: true, registrationNumber: true } },
      recordB: { select: { fullName: true, registrationNumber: true } },
    },
  });

  if (!candidate) {
    throw new Error("Candidate not found.");
  }

  const newStatus = decision === "CONFIRMED" ? MatchReviewStatus.CONFIRMED : MatchReviewStatus.REJECTED;

  const updated = await prisma.matchCandidate.update({
    where: { id: candidateId },
    data: {
      reviewStatus: newStatus,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote: reviewNote?.trim() || null,
    },
  });

  await recordDeduplicationAudit({
    actorUserId: session.user.id,
    action: decision === "CONFIRMED" ? "MATCH_CONFIRMATION" : "MATCH_REJECTION",
    entityType: "MatchCandidate",
    entityId: candidateId,
    description: `Registry staff ${decision === "CONFIRMED" ? "confirmed" : "rejected"} matching pair between '${candidate.recordA.fullName}' and '${candidate.recordB.fullName}'. ${reviewNote ? `Note: ${reviewNote}` : ""}`,
    metadata: {
      candidateId,
      decision,
      reviewNote,
      recordA: candidate.recordA,
      recordB: candidate.recordB,
    },
  });

  revalidatePath(`/registry/review/${candidateId}`);
  revalidatePath("/registry/reviews");
  revalidatePath("/registry");
  revalidatePath("/admin");

  return updated;
}

export interface ExecuteMergeParams {
  candidateId: string;
  masterRecordId: string;
  selectedValues: {
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    gender?: string | null;
    dateOfBirth?: string | Date | null;
    nationalId?: string | null;
    passportNumber?: string | null;
    registrationNumber?: string | null;
    applicantNumber?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    programme?: string | null;
    department?: string | null;
    faculty?: string | null;
    campus?: string | null;
    intake?: string | null;
    academicYear?: string | null;
    address?: string | null;
    [key: string]: any;
  };
  mergeReason?: string;
}

export async function mergeConfirmedRecords(params: ExecuteMergeParams) {
  const session = await requireRegistryAction();

  const candidate = await prisma.matchCandidate.findUnique({
    where: { id: params.candidateId },
    include: {
      recordA: true,
      recordB: true,
    },
  });

  if (!candidate) {
    throw new Error("Match candidate not found.");
  }

  if (candidate.reviewStatus !== MatchReviewStatus.CONFIRMED) {
    throw new Error("Only confirmed duplicate records can proceed to merging. Please confirm the match first.");
  }

  const isAMaster = params.masterRecordId === candidate.recordAId;
  const masterRecord = isAMaster ? candidate.recordA : candidate.recordB;
  const sourceRecord = isAMaster ? candidate.recordB : candidate.recordA;

  const now = new Date();

  // Execute Non-destructive merge in a Prisma Transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update Master Record with selected preserved values
    const updatedMaster = await tx.institutionalRecord.update({
      where: { id: masterRecord.id },
      data: {
        firstName: params.selectedValues.firstName || masterRecord.firstName,
        middleName: params.selectedValues.middleName !== undefined ? params.selectedValues.middleName : masterRecord.middleName,
        lastName: params.selectedValues.lastName || masterRecord.lastName,
        fullName: params.selectedValues.fullName || masterRecord.fullName || `${params.selectedValues.firstName || masterRecord.firstName} ${params.selectedValues.lastName || masterRecord.lastName}`,
        gender: params.selectedValues.gender || null,
        dateOfBirth: params.selectedValues.dateOfBirth ? new Date(params.selectedValues.dateOfBirth) : null,
        nationalId: params.selectedValues.nationalId || null,
        passportNumber: params.selectedValues.passportNumber || null,
        registrationNumber: params.selectedValues.registrationNumber || null,
        applicantNumber: params.selectedValues.applicantNumber || null,
        email: params.selectedValues.email || null,
        phoneNumber: params.selectedValues.phoneNumber || null,
        programme: params.selectedValues.programme || null,
        department: params.selectedValues.department || null,
        faculty: params.selectedValues.faculty || null,
        campus: params.selectedValues.campus || null,
        intake: params.selectedValues.intake || null,
        academicYear: params.selectedValues.academicYear || null,
        address: params.selectedValues.address || null,
        status: "ACTIVE",
      },
    });

    // 2. Mark Source Record as MERGED, pointing to master record
    await tx.institutionalRecord.update({
      where: { id: sourceRecord.id },
      data: {
        status: "MERGED",
        mergedIntoId: masterRecord.id,
        mergedAt: now,
      },
    });

    // 3. Create RecordMerge record storing merge history and field selection
    const recordMerge = await tx.recordMerge.create({
      data: {
        matchCandidateId: candidate.id,
        masterRecordId: masterRecord.id,
        sourceRecordId: sourceRecord.id,
        mergedById: session.user.id,
        selectedValues: params.selectedValues as any,
        previousValues: {
          masterRecordPrevious: masterRecord,
          sourceRecordPrevious: sourceRecord,
        } as any,
        mergeReason: params.mergeReason?.trim() || "Confirmed duplicate records merged by Registry Staff.",
        mergedAt: now,
      },
    });

    // 4. Update MatchCandidate status to MERGED
    await tx.matchCandidate.update({
      where: { id: candidate.id },
      data: {
        reviewStatus: MatchReviewStatus.MERGED,
      },
    });

    return { updatedMaster, recordMerge };
  });

  await recordDeduplicationAudit({
    actorUserId: session.user.id,
    action: "RECORD_MERGING",
    entityType: "RecordMerge",
    entityId: result.recordMerge.id,
    description: `Merged duplicate record '${sourceRecord.fullName}' (${sourceRecord.id}) into master record '${masterRecord.fullName}' (${masterRecord.id}).`,
    metadata: {
      candidateId: candidate.id,
      masterRecordId: masterRecord.id,
      sourceRecordId: sourceRecord.id,
      selectedValues: params.selectedValues,
    },
  });

  revalidatePath("/registry");
  revalidatePath("/registry/records");
  revalidatePath("/registry/reviews");
  revalidatePath("/registry/merged");
  revalidatePath(`/registry/review/${candidate.id}`);
  revalidatePath("/admin");

  return result;
}

export async function getMergedRecords(page = 1, pageSize = 15) {
  await requireRegistryAction();

  const skip = (page - 1) * pageSize;
  const [total, items] = await Promise.all([
    prisma.recordMerge.count(),
    prisma.recordMerge.findMany({
      skip,
      take: pageSize,
      orderBy: { mergedAt: "desc" },
      include: {
        masterRecord: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            programme: true,
            campus: true,
            recordSource: true,
          },
        },
        sourceRecord: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            programme: true,
            campus: true,
            recordSource: true,
          },
        },
        matchCandidate: {
          select: {
            id: true,
            overallScore: true,
            confidenceScore: true,
            classification: true,
            algorithm: true,
          },
        },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAiCandidateAnalysis(candidateId: string) {
  await requireRegistryAction();

  const candidate = await prisma.matchCandidate.findUnique({
    where: { id: candidateId },
    include: {
      recordA: true,
      recordB: true,
      fieldComparisons: true,
    },
  });

  if (!candidate) {
    throw new Error("Match candidate record not found.");
  }

  const aiResult = await analyzeRecordPairWithAi({
    recordA: candidate.recordA,
    recordB: candidate.recordB,
    fieldComparisons: candidate.fieldComparisons,
    overallScore: candidate.overallScore,
    classification: candidate.classification,
  });

  return aiResult;
}

export async function getAiMergeSuggestions(candidateId: string) {
  await requireRegistryAction();

  const candidate = await prisma.matchCandidate.findUnique({
    where: { id: candidateId },
    include: {
      recordA: true,
      recordB: true,
    },
  });

  if (!candidate) {
    throw new Error("Match candidate record not found.");
  }

  const aiResult = await suggestMergePreservationWithAi({
    recordA: candidate.recordA,
    recordB: candidate.recordB,
  });

  return aiResult;
}
