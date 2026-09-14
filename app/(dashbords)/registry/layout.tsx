import { RegistrySidebar } from "@/components/layout/registry-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { requireRegistryPage } from "@/lib/registry-auth";

export default async function RegistryLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRegistryPage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <RegistrySidebar name={session.user.name} />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <DashboardHeader
          title="University of Kigali - Registry Staff Portal"
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role || "REGISTRY_STAFF",
          }}
        />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
