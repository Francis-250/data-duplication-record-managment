"use server";

import prisma from "@/lib/prisma";
import { requireRegistryAction } from "@/lib/registry-auth";
import { InstitutionalRecordStatus, Prisma } from "@prisma/client";

export interface GetRecordsParams {
  query?: string;
  status?: InstitutionalRecordStatus | "ALL";
  campus?: string | "ALL";
  programme?: string | "ALL";
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "fullName" | "registrationNumber" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export async function getInstitutionalRecords(params: GetRecordsParams = {}) {
  await requireRegistryAction();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 15));
  const skip = (page - 1) * pageSize;
  const sortBy = params.sortBy ?? "createdAt";
  const sortOrder = params.sortOrder ?? "desc";

  const where: Prisma.InstitutionalRecordWhereInput = {};

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  if (params.campus && params.campus !== "ALL") {
    where.campus = params.campus;
  }

  if (params.programme && params.programme !== "ALL") {
    where.programme = params.programme;
  }

  if (params.query?.trim()) {
    const q = params.query.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { registrationNumber: { contains: q, mode: "insensitive" } },
      { nationalId: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phoneNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.institutionalRecord.count({ where }),
    prisma.institutionalRecord.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        datasetImport: { select: { originalFileName: true } },
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

export async function getRecordById(id: string) {
  await requireRegistryAction();

  return prisma.institutionalRecord.findUnique({
    where: { id },
    include: {
      datasetImport: true,
      masterMerges: {
        include: {
          sourceRecord: true,
        },
      },
      sourceMerges: {
        include: {
          masterRecord: true,
        },
      },
      recordAComparisons: {
        take: 5,
        orderBy: { overallScore: "desc" },
        include: { recordB: true },
      },
      recordBComparisons: {
        take: 5,
        orderBy: { overallScore: "desc" },
        include: { recordA: true },
      },
    },
  });
}
