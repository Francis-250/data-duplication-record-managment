import { DoctorSidebar } from "@/components/layout/doctor-sidebar";
import { requireDoctorPage } from "@/lib/doctor-auth";
import prisma from "@/lib/prisma";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDoctorPage();

  const profile = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { specialization: true },
  });

  return (
    <div className="h-screen overflow-hidden bg-background">
      <DoctorSidebar
        name={session.user.name}
        specialty={profile?.specialization ?? "Doctor"}
      />
      <main className="h-[calc(100vh-3.5rem)] overflow-y-auto lg:ml-56 lg:h-screen">
        {children}
      </main>
    </div>
  );
}
