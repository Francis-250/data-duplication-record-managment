import { getDeduplicationAuditLogs } from "@/actions/admin/operations";
import { requireAdminPage } from "@/lib/admin-auth";
import { AdminAuditClient } from "@/components/admin-audit-client";

export default async function AdminAuditPage() {
  await requireAdminPage();
  const data = await getDeduplicationAuditLogs({ pageSize: 150 });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">System Activity Monitoring & Audit Trail</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Comprehensive log of all registry actions: dataset imports, data validations, deduplication executions, match reviews, merges, and permission changes.
        </p>
      </div>

      <AdminAuditClient initialLogs={data.items} />
    </div>
  );
}
