import { getMatchCandidateDetail } from "@/actions/registry/deduplication";
import { requireRegistryPage } from "@/lib/registry-auth";
import { RegistrySideBySideReview } from "@/components/registry-side-by-side-review";
import { notFound } from "next/navigation";

export default async function RegistryReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRegistryPage();
  const { id } = await params;

  let candidate = null;
  try {
    candidate = await getMatchCandidateDetail(id);
  } catch {
    notFound();
  }

  if (!candidate) {
    notFound();
  }

  return <RegistrySideBySideReview candidate={candidate} />;
}
