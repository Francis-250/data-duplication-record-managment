import { getMatchCandidateDetail } from "@/actions/registry/deduplication";
import { requireRegistryPage } from "@/lib/registry-auth";
import { RegistryMergeTool } from "@/components/registry-merge-tool";
import { notFound, redirect } from "next/navigation";

export default async function RegistryMergePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  await requireRegistryPage();
  const { candidateId } = await params;

  let candidate = null;
  try {
    candidate = await getMatchCandidateDetail(candidateId);
  } catch {
    notFound();
  }

  if (!candidate) {
    notFound();
  }

  // If candidate is not confirmed, redirect back to review
  if (candidate.reviewStatus !== "CONFIRMED" && candidate.reviewStatus !== "MERGED") {
    redirect(`/registry/review/${candidateId}`);
  }

  return <RegistryMergeTool candidate={candidate} />;
}
