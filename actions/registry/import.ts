"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRegistryAction } from "@/lib/registry-auth";
import { parseAndValidateCsv, ParsedStudentRow } from "@/lib/deduplication/csv-importer";
import { computeStandardizedFields } from "@/lib/deduplication/standardization";
import { recordDeduplicationAudit } from "@/lib/deduplication/audit";
import { ImportStatus, Prisma } from "@prisma/client";

export async function uploadAndValidateCsv(formData: FormData) {
  const session = await requireRegistryAction();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("No file uploaded.");
  }

  const fileName = file.name;
  const mimeType = file.type || "text/csv";
  const fileSize = file.size;

  if (!fileName.toLowerCase().endsWith(".csv") && !mimeType.includes("csv") && !mimeType.includes("text")) {
    throw new Error("Invalid file format. Please upload a standard CSV file.");
  }

  const csvText = await file.text();
  const analysis = parseAndValidateCsv(csvText, fileName);

  let status: ImportStatus = ImportStatus.PENDING;
  if (!analysis.isValid) {
    status = analysis.validRows.length > 0 ? ImportStatus.PARTIALLY_VALID : ImportStatus.INVALID;
  } else {
    status = ImportStatus.VALID;
  }

  const datasetImport = await prisma.datasetImport.create({
    data: {
      originalFileName: fileName,
      storedFileName: `import-${Date.now()}-${fileName.replace(/\s+/g, "_")}`,
      fileSize,
      mimeType,
      uploadedById: session.user.id,
      status,
      totalRows: analysis.totalRows,
      validRows: analysis.validRows.length,
      invalidRows: analysis.invalidRowsCount,
      duplicateRows: analysis.duplicateRowsCount,
      validationErrors: JSON.parse(
        JSON.stringify({
          errors: analysis.errors,
          duplicateRowNumbers: analysis.duplicateRowNumbers,
          validSample: analysis.validRows.slice(0, 5),
          serializedRows: analysis.validRows, // preserve parsed rows for commit
        })
      ) as Prisma.InputJsonValue,
    },
  });

  await recordDeduplicationAudit({
    actorUserId: session.user.id,
    action: "DATASET_IMPORT",
    entityType: "DatasetImport",
    entityId: datasetImport.id,
    description: `Registry staff uploaded dataset '${fileName}' with ${analysis.totalRows} rows (${analysis.validRows.length} valid, ${analysis.invalidRowsCount} invalid, ${analysis.duplicateRowsCount} in-file duplicates).`,
    metadata: {
      fileName,
      totalRows: analysis.totalRows,
      validRows: analysis.validRows.length,
      status,
    },
  });

  revalidatePath("/registry/import");
  return {
    importId: datasetImport.id,
    status,
    totalRows: analysis.totalRows,
    validRowsCount: analysis.validRows.length,
    invalidRowsCount: analysis.invalidRowsCount,
    duplicateRowsCount: analysis.duplicateRowsCount,
    errors: analysis.errors,
  };
}

export async function commitDatasetImport(datasetImportId: string) {
  const session = await requireRegistryAction();

  const dataset = await prisma.datasetImport.findUnique({
    where: { id: datasetImportId },
  });

  if (!dataset) {
    throw new Error("Dataset import not found.");
  }

  if (dataset.status === ImportStatus.IMPORTED) {
    throw new Error("Dataset has already been imported.");
  }

  const rawJson = dataset.validationErrors as any;
  const rowsToImport: ParsedStudentRow[] = rawJson?.serializedRows || [];

  if (rowsToImport.length === 0) {
    throw new Error("No valid rows available in this dataset to import.");
  }

  // Insert records in batches of 100
  let importedCount = 0;
  const batchSize = 100;

  for (let i = 0; i < rowsToImport.length; i += batchSize) {
    const batch = rowsToImport.slice(i, i + batchSize);

    await prisma.$transaction(
      batch.map((row) => {
        const std = computeStandardizedFields({
          firstName: row.firstName,
          middleName: row.middleName,
          lastName: row.lastName,
          fullName: row.fullName,
          email: row.email,
          phoneNumber: row.phoneNumber,
          registrationNumber: row.registrationNumber,
          nationalId: row.nationalId,
        });

        return prisma.institutionalRecord.create({
          data: {
            recordType: "STUDENT",
            firstName: row.firstName,
            middleName: row.middleName,
            lastName: row.lastName,
            fullName: row.fullName,
            gender: row.gender,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            nationalId: row.nationalId,
            passportNumber: row.passportNumber,
            registrationNumber: row.registrationNumber,
            applicantNumber: row.applicantNumber,
            staffNumber: row.staffNumber,
            email: row.email,
            phoneNumber: row.phoneNumber,
            programme: row.programme,
            department: row.department,
            faculty: row.faculty,
            campus: row.campus || "Kigali Campus",
            intake: row.intake,
            academicYear: row.academicYear,
            address: row.address,
            recordSource: dataset.originalFileName,
            status: "ACTIVE",
            submittedById: session.user.id,
            datasetImportId: dataset.id,
            standardizedName: std.standardizedName,
            standardizedEmail: std.standardizedEmail,
            standardizedPhone: std.standardizedPhone,
            standardizedRegistrationNumber: std.standardizedRegistrationNumber,
            standardizedNationalId: std.standardizedNationalId,
          },
        });
      })
    );

    importedCount += batch.length;
  }

  await prisma.datasetImport.update({
    where: { id: dataset.id },
    data: {
      status: ImportStatus.IMPORTED,
      importedAt: new Date(),
    },
  });

  await recordDeduplicationAudit({
    actorUserId: session.user.id,
    action: "DATA_VALIDATION",
    entityType: "DatasetImport",
    entityId: dataset.id,
    description: `Committed import of ${importedCount} student records from '${dataset.originalFileName}'.`,
    metadata: {
      datasetImportId: dataset.id,
      importedCount,
    },
  });

  revalidatePath("/registry");
  revalidatePath("/registry/records");
  revalidatePath("/registry/import");
  return { success: true, importedCount };
}

export async function getDatasetImports() {
  await requireRegistryAction();
  return prisma.datasetImport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { records: true, matchRuns: true } },
    },
  });
}
