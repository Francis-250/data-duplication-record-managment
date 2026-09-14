import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronLeft,
  Clock,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientDoctorAssignment } from "@/components/patient-doctor-assignment";
import { Separator } from "@/components/ui/separator";
import { getServerSession } from "@/hooks/get-server-session";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";

type Risk = "HIGH" | "MEDIUM" | "LOW";

const cfg: Record<
  Risk,
  {
    icon: React.ElementType;
    iconColor: string;
    label: string;
    labelColor: string;
    ring: string;
    badge: string;
    bar: string;
  }
> = {
  HIGH: {
    icon: AlertTriangle,
    iconColor: "text-red-500",
    label: "High risk",
    labelColor: "text-red-700",
    ring: "border-red-200 bg-red-50",
    badge: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-500",
  },
  MEDIUM: {
    icon: AlertCircle,
    iconColor: "text-amber-500",
    label: "Medium risk",
    labelColor: "text-amber-700",
    ring: "border-amber-200 bg-amber-50",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-400",
  },
  LOW: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    label: "Low risk",
    labelColor: "text-green-700",
    ring: "border-green-200 bg-green-50",
    badge: "bg-green-50 text-green-700 border-green-200",
    bar: "bg-green-500",
  },
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export default async function SingleAssessment({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      doctorComments: {
        orderBy: { createdAt: "desc" },
        include: {
          doctorProfile: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      doctorAssignment: true,
      doctorFeedback: true,
    },
  });

  if (!assessment) {
    notFound();
  }

  const c = cfg[assessment.riskLevel];
  const Icon = c.icon;
  const confidence = Math.round(assessment.confidenceScore * 100);
  const symptoms = asStringArray(assessment.detectedSymptoms);
  const latestComment = assessment.doctorComments[0];
  const approvedDoctors = await prisma.doctorProfile.findMany({
    where: { isApprovedByAdmin: true, isVerified: true },
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      specialization: true,
      hospitalName: true,
      user: { select: { name: true } },
    },
  });
  const existingFeedback = assessment.doctorFeedback.find(
    (item) => item.doctorProfileId === assessment.doctorAssignment?.doctorProfileId,
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Link
          href="/patient"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={15} /> Back
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm text-muted-foreground">
          Assessment #{assessment.id.slice(0, 8)}
        </span>
        <span className="text-muted-foreground/40">/</span>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock size={12} /> {formatDateTime(assessment.createdAt)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="rounded-lg border p-5">
            <div
              className={cn(
                "w-14 h-14 rounded-full border-2 flex items-center justify-center mb-4",
                c.ring,
              )}
            >
              <Icon size={24} className={c.iconColor} />
            </div>
            <p className={cn("text-lg font-semibold", c.labelColor)}>
              {c.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">
              Confidence: {confidence}%
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", c.bar)}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              FAST score
            </p>
            <div className="flex gap-1.5 mb-2">
              {["F", "A", "S", "T"].map((l, i) => (
                <div
                  key={l}
                  className={cn(
                    "flex-1 h-8 rounded flex items-center justify-center text-xs font-bold",
                    i < assessment.fastScore
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {assessment.fastScore} of 4 indicators
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Detected symptoms
            </p>
            <div className="flex flex-wrap gap-1.5">
              {symptoms.length > 0 ? (
                symptoms.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-muted px-2.5 py-1 rounded-sm font-medium"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">None flagged</p>
              )}
            </div>
            {assessment.symptomsText && (
              <>
                <Separator className="my-3" />
                <p className="text-[11px] text-muted-foreground mb-1">
                  Patient description
                </p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  &quot;{assessment.symptomsText}&quot;
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/patient/assessment">
                <RefreshCw size={13} className="mr-2" /> New assessment
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/patient">
                <ChevronLeft size={13} className="mr-1" /> Back
              </Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border overflow-hidden bg-card">
            <div className="border-b px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 flex size-10 items-center justify-center rounded-lg border", c.ring)}>
                    <Icon size={18} className={c.iconColor} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      AI result summary
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight">
                      {c.label} assessment
                    </h2>
                  </div>
                </div>
                <Badge variant="outline" className={cn("border", c.badge)}>
                  {confidence}% confidence
                </Badge>
              </div>
            </div>

            <div className="grid gap-px bg-border sm:grid-cols-3">
              <div className="bg-background p-4">
                <p className="text-xs text-muted-foreground">Risk level</p>
                <p className={cn("mt-1 text-xl font-semibold", c.labelColor)}>
                  {assessment.riskLevel}
                </p>
              </div>
              <div className="bg-background p-4">
                <p className="text-xs text-muted-foreground">FAST indicators</p>
                <p className="mt-1 text-xl font-semibold">
                  {assessment.fastScore}/4
                </p>
              </div>
              <div className="bg-background p-4">
                <p className="text-xs text-muted-foreground">Review status</p>
                <p className="mt-1 text-xl font-semibold">
                  {assessment.reviewedByDoctor ? "Reviewed" : "Pending"}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confidence score</span>
                  <span className="font-medium">{confidence}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", c.bar)}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>

              <div
                className={cn(
                  "rounded-lg border p-4",
                  assessment.riskLevel === "HIGH"
                    ? "border-red-200 bg-red-50"
                    : assessment.riskLevel === "MEDIUM"
                      ? "border-amber-200 bg-amber-50"
                      : "border-green-200 bg-green-50",
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Recommended next step
                </p>
                <p className="text-sm leading-relaxed">
                  {assessment.recommendation}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.7fr_1.3fr]">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Symptoms used
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {symptoms.length > 0 ? (
                      symptoms.map((symptom) => (
                        <span
                          key={symptom}
                          className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {symptom}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">None flagged</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                      <Brain size={13} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">AI explanation</p>
                      <p className="text-xs text-muted-foreground">
                        Groq LLaMA 3.3 70B
                      </p>
                    </div>
                  </div>
                  <p className="max-h-[28rem] overflow-y-auto pr-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {assessment.aiResponse}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {latestComment && (
            <div
              className={cn(
                "rounded-lg border p-5",
                latestComment.isUrgent && "border-red-200",
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare
                      size={13}
                      className="text-muted-foreground"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {latestComment.doctorProfile.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {latestComment.doctorProfile.specialization ?? "Doctor"}
                    </p>
                  </div>
                </div>
                {latestComment.isUrgent && (
                  <Badge variant="destructive" className="text-[11px]">
                    Urgent
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {latestComment.comment}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(latestComment.createdAt)}
              </p>
            </div>
          )}

          <PatientDoctorAssignment
            assessmentId={assessment.id}
            assignedDoctorId={assessment.doctorAssignment?.doctorProfileId}
            existingFeedback={existingFeedback?.comment}
            doctors={approvedDoctors.map((doctor) => ({
              id: doctor.id,
              name: doctor.user.name,
              specialization: doctor.specialization ?? "Doctor",
              hospital: doctor.hospitalName ?? "Hospital not provided",
            }))}
          />

          <p className="text-xs text-muted-foreground">
            This is not a medical diagnosis. Always consult a qualified
            healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
}
