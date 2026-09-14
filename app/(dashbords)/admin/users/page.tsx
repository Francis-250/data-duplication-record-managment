import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminUsersClient } from "@/components/admin-users-client";
import { requireAdminPage } from "@/lib/admin-auth";
import { formatAdminDate } from "@/lib/admin";
import prisma from "@/lib/prisma";

export default async function AdminUsersPage() {
  await requireAdminPage();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10"><AdminPageHeader eyebrow="Access control" title="Users" description="Manage roles, account status, and access." /><AdminUsersClient users={users.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role ?? "patient", banned: user.banned ?? false, verified: user.emailVerified, createdAt: formatAdminDate(user.createdAt) }))} /></div>;
}
