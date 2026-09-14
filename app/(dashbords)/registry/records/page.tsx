import prisma from "@/lib/prisma";
import { requireRegistryPage } from "@/lib/registry-auth";
import { RegistryRecordsClient } from "@/components/registry-records-client";

export default async function RegistryRecordsPage() {
  await requireRegistryPage();

  const records = await prisma.institutionalRecord.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      datasetImport: { select: { originalFileName: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Student Records Registry</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Complete master and institutional records of the DATA DEDUPLICATION AND RECORD MATCHING SYSTEM across all campuses.
        </p>
      </div>

      <RegistryRecordsClient initialRecords={records} />
    </div>
  );
}
