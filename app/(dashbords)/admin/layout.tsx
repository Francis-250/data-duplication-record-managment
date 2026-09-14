import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSidebar name={session.user.name} />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <DashboardHeader
          title="DATA DEDUPLICATION AND RECORD MATCHING SYSTEM - Administration"
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role || "ADMIN",
          }}
        />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
