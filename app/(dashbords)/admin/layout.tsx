import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();

  return (
    <div className="h-screen overflow-hidden bg-background">
      <AdminSidebar name={session.user.name} />
      <main className="h-[calc(100vh-3.5rem)] overflow-y-auto lg:ml-56 lg:h-screen">
        {children}
      </main>
    </div>
  );
}
