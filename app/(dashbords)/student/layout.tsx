import { StudentSidebar } from "@/components/layout/student-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { requireStudentPage } from "@/lib/student-auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStudentPage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudentSidebar name={session.user.name} />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <DashboardHeader
          title="University of Kigali - Student Record Portal"
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role || "STUDENT",
          }}
        />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
