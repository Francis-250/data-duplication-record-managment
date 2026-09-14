import { getDeduplicationSettings } from "@/actions/admin/operations";
import { requireAdminPage } from "@/lib/admin-auth";
import { AdminSettingsClient } from "@/components/admin-settings-client";

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const settings = await getDeduplicationSettings();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Deduplication & System Configuration</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Adjust similarity thresholds, default classification algorithms, and institutional registry defaults.
        </p>
      </div>

      <AdminSettingsClient initialSettings={settings} />
    </div>
  );
}
