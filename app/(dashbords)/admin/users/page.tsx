import { getAdminUsers } from "@/actions/admin/operations";
import { requireAdminPage } from "@/lib/admin-auth";
import { AdminUsersClient } from "@/components/admin-users-client";

export default async function AdminUsersPage() {
  await requireAdminPage();
  const data = await getAdminUsers({ pageSize: 100 });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">System User Management & Access Control</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Assign institutional roles (STUDENT, REGISTRY_STAFF, ADMIN), monitor email verification status, and manage account suspension.
        </p>
      </div>

      <AdminUsersClient initialUsers={data.items} />
    </div>
  );
}
