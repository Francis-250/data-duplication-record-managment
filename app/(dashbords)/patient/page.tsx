import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ChevronRight, Clock } from "lucide-react";
import { getServerSession } from "@/hooks/get-server-session";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Risk = "HIGH" | "MEDIUM" | "LOW";

const riskBadge: Record<Risk, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-green-50 text-green-700 border-green-200",
};

const riskDot: Record<Risk, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-green-500",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export default async function PatientDashboard() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const assessments = await prisma.assessment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      riskLevel: true,
      confidenceScore: true,
      detectedSymptoms: true,
      createdAt: true,
      status: true,
    },
  });

  const highRiskCount = assessments.filter((a) => a.riskLevel === "HIGH").length;
  const averageConfidence =
    assessments.length > 0
      ? Math.round(
          (assessments.reduce((sum, a) => sum + a.confidenceScore, 0) /
            assessments.length) *
            100,
        )
      : 0;
  const latestHighRisk = assessments.find(
    (a) => a.riskLevel === "HIGH" && a.status !== "REVIEWED",
  );
  const name = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Patient portal</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hello, {name}
          </h1>
        </div>
        <Button asChild size="sm">
          <Link href="/patient/assessment">
            New assessment <ArrowRight size={14} className="ml-1.5" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {latestHighRisk && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800 mb-1">
                Unreviewed high-risk result
              </p>
              <p className="text-xs text-red-600 leading-relaxed">
                Your {formatDate(latestHighRisk.createdAt)} assessment was
                flagged high risk. Please seek medical attention immediately.
              </p>
              <Link
                href={`/patient/assessment/${latestHighRisk.id}`}
                className="mt-3 inline-flex text-xs font-medium text-red-700 underline underline-offset-2"
              >
                View result
              </Link>
            </div>
          )}

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              FAST method
            </p>
            <div className="space-y-3">
              {[
                { l: "F", title: "Face", body: "Is one side drooping?" },
                { l: "A", title: "Arms", body: "Can you raise both equally?" },
                { l: "S", title: "Speech", body: "Is speech slurred?" },
                { l: "T", title: "Time", body: "Call emergency services" },
              ].map(({ l, title, body }) => (
                <div key={l} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {l}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-semibold">{assessments.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-red-600">
                {highRiskCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                High risk
              </p>
            </div>
            <div>
              <p className="text-xl font-semibold">{averageConfidence}%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Avg conf.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <p className="text-sm font-medium">Assessment history</p>
            <Link
              href="/patient/assessment"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              New
            </Link>
          </div>

          <div className="hidden sm:grid grid-cols-12 px-4 py-2 border-b bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <span className="col-span-3">Date</span>
            <span className="col-span-4">Symptoms</span>
            <span className="col-span-2">Confidence</span>
            <span className="col-span-3 text-right">Risk</span>
          </div>

          {assessments.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No assessments yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start a symptom check whenever you need one.
              </p>
            </div>
          ) : (
            assessments.map((a) => {
              const symptoms = asStringArray(a.detectedSymptoms);
              const confidence = Math.round(a.confidenceScore * 100);

              return (
                <Link
                  key={a.id}
                  href={`/patient/assessment/${a.id}`}
                  className="w-full grid grid-cols-12 items-center px-4 py-3.5 border-b last:border-0 hover:bg-muted/30 transition-colors text-left group"
                >
                  <div className="col-span-4 sm:col-span-3">
                    <p className="text-sm font-medium">{formatDate(a.createdAt)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {formatTime(a.createdAt)}
                    </p>
                  </div>
                  <div className="col-span-4 flex flex-wrap gap-1">
                    {symptoms.length > 0 ? (
                      symptoms.slice(0, 2).map((s) => (
                        <span
                          key={s}
                          className="text-[11px] bg-muted px-2 py-0.5 rounded-sm text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                  <div className="hidden sm:block col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full", riskDot[a.riskLevel])}
                          style={{ width: `${confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {confidence}%
                      </span>
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2">
                    <span
                      className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded border",
                        riskBadge[a.riskLevel],
                      )}
                    >
                      {a.riskLevel.charAt(0) +
                        a.riskLevel.slice(1).toLowerCase()}
                    </span>
                    <ChevronRight
                      size={13}
                      className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
                    />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
