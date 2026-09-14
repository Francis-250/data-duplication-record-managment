import Link from "next/link";
import { AlertTriangle, ArrowRight, Brain, Stethoscope, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/admin-auth";
import { formatAdminDateTime } from "@/lib/admin";
import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  await requireAdminPage();
  const [users, doctors, assessments, pendingDoctors, highRisk, aiFailures, recentLogs] = await Promise.all([
    prisma.user.count(),
    prisma.doctorProfile.count(),
    prisma.assessment.count(),
    prisma.doctorProfile.count({ where: { isApprovedByAdmin: false } }),
    prisma.assessment.count({ where: { riskLevel: "HIGH", reviewedByDoctor: false } }),
    prisma.aiUsageLog.count({ where: { status: { not: "SUCCESS" } } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }),
  ]);
  const cards = [
    { label: "Total users", value: users, href: "/admin/users", icon: Users },
    { label: "Doctor profiles", value: doctors, href: "/admin/doctors", icon: Stethoscope },
    { label: "Assessments", value: assessments, href: "/admin/assessments", icon: AlertTriangle },
    { label: "AI failures", value: aiFailures, href: "/admin/ai", icon: Brain },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <AdminPageHeader eyebrow="System overview" title="Dashboard" description="Monitor users, clinical activity, and platform operations." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map(({ label, value, href, icon: Icon }) => <Link href={href} key={label} className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"><div className="flex justify-between gap-3"><p className="text-2xl font-semibold">{value}</p><Icon size={16} className="text-muted-foreground" /></div><p className="mt-1 text-xs text-muted-foreground">{label}</p></Link>)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-3">
          <Link href="/admin/doctors" className="rounded-lg border p-4 flex items-center justify-between hover:bg-muted/30"><div><p className="text-sm font-medium">Pending doctor approvals</p><p className="text-xs text-muted-foreground mt-1">Credentials awaiting review</p></div><Badge variant={pendingDoctors ? "destructive" : "secondary"}>{pendingDoctors}</Badge></Link>
          <Link href="/admin/assessments" className="rounded-lg border p-4 flex items-center justify-between hover:bg-muted/30"><div><p className="text-sm font-medium">Unreviewed high risk</p><p className="text-xs text-muted-foreground mt-1">Assessments needing attention</p></div><Badge variant={highRisk ? "destructive" : "secondary"}>{highRisk}</Badge></Link>
        </div>
        <div className="lg:col-span-2 rounded-lg border overflow-hidden">
          <div className="border-b px-4 py-3 flex items-center justify-between"><p className="text-sm font-medium">Recent audit activity</p><Link href="/admin/audit" className="text-xs text-muted-foreground flex items-center gap-1">View all <ArrowRight size={12} /></Link></div>
          <div className="divide-y">{recentLogs.map((log) => <div key={log.id} className="px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{log.action.replaceAll("_", " ").toLowerCase()}</p><p className="text-[11px] text-muted-foreground">{formatAdminDateTime(log.createdAt)}</p></div><p className="mt-0.5 text-xs text-muted-foreground">{log.description ?? "System event"} · {log.user?.name ?? "System"}</p></div>)}{recentLogs.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No audit activity yet.</p>}</div>
        </div>
      </div>
    </div>
  );
}
