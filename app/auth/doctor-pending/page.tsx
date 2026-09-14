import { Clock3 } from "lucide-react";
import { DoctorPendingActions } from "@/components/doctor-pending-actions";

export default async function DoctorPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border p-8 text-center">
        <div className="mx-auto mb-4 size-12 rounded-full bg-muted flex items-center justify-center">
          <Clock3 size={20} className="text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Approval pending</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {reason ??
            "Your doctor profile was submitted successfully. An administrator must approve your submitted credentials before you can sign in to the doctor portal."}
        </p>
        <DoctorPendingActions />
      </div>
    </main>
  );
}
