import { AdminPageHeader } from "@/components/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/admin-auth";
import { formatAdminDateTime } from "@/lib/admin";
import prisma from "@/lib/prisma";

export default async function AdminAuditPage() {
  await requireAdminPage();
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { name: true, email: true } } } });
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10"><AdminPageHeader eyebrow="Security and compliance" title="Audit logs" description="A chronological record of important platform activity." /><div className="rounded-lg border divide-y">{logs.map((log) => <div key={log.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-4"><div className="md:col-span-3"><Badge variant="outline">{log.action}</Badge><p className="mt-1 text-xs text-muted-foreground">{formatAdminDateTime(log.createdAt)}</p></div><div className="md:col-span-6"><p className="text-sm">{log.description ?? "No description"}</p><p className="mt-1 text-xs text-muted-foreground">{log.entity ?? "System"} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}</p></div><div className="md:col-span-3 md:text-right"><p className="text-sm">{log.user?.name ?? "System"}</p><p className="text-xs text-muted-foreground">{log.ipAddress ?? "No IP"}</p></div></div>)}{logs.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No audit logs found.</p>}</div></div>;
}
