import { DoctorAssessmentList } from "@/components/doctor-assessment-list";
import { Badge } from "@/components/ui/badge";
import { requireDoctorPage } from "@/lib/doctor-auth";
import { asStringArray, formatDate, formatTime, riskOrder } from "@/lib/doctor";
import prisma from "@/lib/prisma";

export default async function DoctorDashboard() {
  const session = await requireDoctorPage();

  const assessments = await prisma.assessment.findMany({
    where: { doctorAssignment: { doctorProfile: { userId: session.user.id } } },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  assessments.sort(
    (a, b) =>
      riskOrder[a.riskLevel] - riskOrder[b.riskLevel] ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const today = new Date();
  const reviewedToday = assessments.filter(
    (item) =>
      item.reviewedAt &&
      item.reviewedAt.toDateString() === today.toDateString(),
  ).length;
  const stats = [
    { label: "Total assigned", value: assessments.length },
    {
      label: "Unreviewed",
      value: assessments.filter((item) => !item.reviewedByDoctor).length,
      destructive: true,
    },
    {
      label: "High risk",
      value: assessments.filter((item) => item.riskLevel === "HIGH").length,
    },
    { label: "Reviewed today", value: reviewedToday },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-1">
          {new Intl.DateTimeFormat("en", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(today)}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-2xl font-semibold">{stat.value}</p>
              {stat.destructive && stat.value > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  Pending
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <DoctorAssessmentList
        assessments={assessments.map((item) => ({
          id: item.id,
          patientName: item.user.name,
          date: formatDate(item.createdAt),
          time: formatTime(item.createdAt),
          symptoms: asStringArray(item.detectedSymptoms),
          confidence: Math.round(item.confidenceScore * 100),
          riskLevel: item.riskLevel,
          reviewed: item.reviewedByDoctor,
        }))}
      />
    </div>
  );
}
