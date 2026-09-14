import { getDatasetImports } from "@/actions/registry/import";
import { requireRegistryPage } from "@/lib/registry-auth";
import { RegistryImportClient } from "@/components/registry-import-client";

export default async function RegistryImportPage() {
  await requireRegistryPage();
  const imports = await getDatasetImports();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Dataset Import & Quality Validation</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Upload student record batches in CSV format, detect in-file duplicates, and commit verified student cohorts to the registry.
        </p>
      </div>

      <RegistryImportClient initialImports={imports} />
    </div>
  );
}
