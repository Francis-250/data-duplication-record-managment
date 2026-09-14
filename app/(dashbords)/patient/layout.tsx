import PatientNav from "@/components/layout/patient-nav";
import { requirePatientPage } from "@/lib/patient-auth";
import prisma from "@/lib/prisma";

function initials(name?: string | null) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? null
  );
}

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePatientPage();
  const unreadCount = await prisma.notification.count({
    where: {
      userId: session.user.id,
      status: "UNREAD",
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <PatientNav
        initials={initials(session?.user.name)}
        unreadCount={unreadCount}
      />
      <main className="pb-20 sm:pb-0">{children}</main>
    </div>
  );
}
