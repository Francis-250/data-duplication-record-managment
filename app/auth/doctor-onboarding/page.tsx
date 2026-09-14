import { DoctorOnboardingForm } from "@/components/doctor-onboarding-form";

export default function DoctorOnboardingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Doctor registration</p>
          <h1 className="text-4xl font-semibold tracking-tight">Complete your professional profile</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your email is verified. Submit your medical credentials for administrator review. You can access the doctor portal after approval.
          </p>
        </div>
        <div className="rounded-lg border p-8">
          <h2 className="mb-6 text-xl font-semibold">Professional details</h2>
          <DoctorOnboardingForm />
        </div>
      </div>
    </main>
  );
}
