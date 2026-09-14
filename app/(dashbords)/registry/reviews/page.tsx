import { getMatchCandidates } from "@/actions/registry/deduplication";
import { requireRegistryPage } from "@/lib/registry-auth";
import { RegistryReviewsClient } from "@/components/registry-reviews-client";

export default async function RegistryReviewsPage() {
  await requireRegistryPage();
  const data = await getMatchCandidates({ pageSize: 100 });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Matching Candidate Pair Reviews</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Review potential duplicate student records side by side. Confirm or reject pairs before merging duplicate entries.
        </p>
      </div>

      <RegistryReviewsClient initialData={data} />
    </div>
  );
}
