import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";
import { DoctorCommentForm } from "@/components/doctor-comment-form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { requireDoctorPage } from "@/lib/doctor-auth";
import { asStringArray, formatDate, formatTime } from "@/lib/doctor";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right">{value || "-"}</span>
    </div>
  );
}

function RiskFlag({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={cn("flex items-center justify-between rounded-md border px-3 py-2 text-xs", active && "border-destructive/30 bg-destructive/5")}>
      {label}
      {active ? <AlertTriangle size={12} className="text-destructive" /> : <CheckCircle2 size={12} className="text-muted-foreground/40" />}
    </div>
  );
}

export default async function DoctorReviewDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireDoctorPage();

  const { id } = await params;
  const assessment = await prisma.assessment.findFirst({
    where: { id, doctorAssignment: { doctorProfile: { userId: session.user.id } } },
    include: {
      user: { include: { patientProfile: true } },
      doctorComments: {
        orderBy: { createdAt: "desc" },
        include: {
          doctorProfile: { include: { user: { select: { name: true } } } },
        },
      },
    },
  });
  if (!assessment) notFound();

  const patient = assessment.user.patientProfile;
  const confidence = Math.round(assessment.confidenceScore * 100);
  const riskBar =
    assessment.riskLevel === "HIGH"
      ? "bg-destructive"
      : assessment.riskLevel === "MEDIUM"
        ? "bg-amber-500"
        : "bg-emerald-600";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <Link href="/doctor/reviews" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={15} /> Reviews
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Assessment review</h1>
          <Badge variant={assessment.reviewedByDoctor ? "secondary" : "outline"}>
            {assessment.reviewedByDoctor ? "Reviewed" : "Unreviewed"}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(assessment.createdAt)} at {formatTime(assessment.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Patient</p>
            <p className="text-base font-semibold mb-2">{assessment.user.name}</p>
            <InfoRow label="Age" value={patient?.age} />
            <InfoRow label="Gender" value={patient?.gender} />
            <InfoRow label="Blood type" value={patient?.bloodType} />
            <InfoRow label="Conditions" value={patient?.existingConditions} />
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Risk factors</p>
            <div className="grid grid-cols-2 gap-2">
              <RiskFlag label="Smoking" active={patient?.smokingStatus ?? false} />
              <RiskFlag label="Diabetic" active={patient?.diabetic ?? false} />
              <RiskFlag label="Hypertension" active={patient?.hypertension ?? false} />
              <RiskFlag label="Heart disease" active={patient?.heartDisease ?? false} />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Risk level</p>
                <p className="text-lg font-semibold capitalize">{assessment.riskLevel.toLowerCase()}</p>
              </div>
              <div className="size-16 rounded-full border-4 flex items-center justify-center text-sm font-semibold">
                {confidence}%
              </div>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full", riskBar)} style={{ width: `${confidence}%` }} />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">FAST score</p>
            <div className="flex gap-1.5">
              {["F", "A", "S", "T"].map((letter, index) => (
                <div key={letter} className={cn("flex-1 h-9 rounded-md flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground", index < assessment.fastScore && "bg-destructive/10 text-destructive border border-destructive/20")}>
                  {letter}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{assessment.fastScore} of 4 indicators</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center"><Brain size={14} /></div>
              <div>
                <p className="text-sm font-medium">AI response</p>
                <p className="text-xs text-muted-foreground">Groq LLaMA 3.3 70B</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{assessment.aiResponse}</p>
            <Separator className="my-4" />
            <p className="text-xs font-medium mb-1">Recommendation</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{assessment.recommendation}</p>
            <Separator className="my-4" />
            <p className="text-xs font-medium mb-2">Detected symptoms</p>
            <div className="flex flex-wrap gap-1.5">
              {asStringArray(assessment.detectedSymptoms).map((symptom) => (
                <span key={symptom} className="rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground">{symptom}</span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <MessageSquare size={14} />
              <p className="text-sm font-medium">Comment history</p>
            </div>
            {assessment.doctorComments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No doctor comments yet.</p>
            ) : (
              <div className="divide-y">
                {assessment.doctorComments.map((comment) => (
                  <div key={comment.id} className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-medium">{comment.doctorProfile.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {comment.doctorProfile.specialization ?? "Doctor"} · {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}
                        </p>
                      </div>
                      {comment.isUrgent && <Badge variant="destructive">Urgent</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DoctorCommentForm assessmentId={assessment.id} />
        </div>
      </div>
    </div>
  );
}
