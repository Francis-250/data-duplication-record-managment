import prisma from "@/lib/prisma";
import { requireRegistryPage } from "@/lib/registry-auth";
import { RegistryDeduplicationClient } from "@/components/registry-deduplication-client";

export default async function RegistryDeduplicationPage() {
  await requireRegistryPage();

  const [imports, recentRuns, totalRecords] = await Promise.all([
    prisma.datasetImport.findMany({
      where: { status: "IMPORTED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.matchRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        datasetImport: { select: { originalFileName: true } },
      },
    }),
    prisma.institutionalRecord.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Run Record Deduplication Pipeline</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Compare institutional student records, calculate multi-attribute similarity scores, and classify pairs as MATCH, POSSIBLE_MATCH, or NON_MATCH.
        </p>
      </div>

      <RegistryDeduplicationClient
        imports={imports}
        recentRuns={recentRuns}
        totalRecords={totalRecords}
      />
    </div>
  );
}
