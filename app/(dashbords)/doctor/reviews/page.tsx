import { DoctorAssessmentList } from "@/components/doctor-assessment-list";
import { requireDoctorPage } from "@/lib/doctor-auth";
import { asStringArray, formatDate, formatTime, riskOrder } from "@/lib/doctor";
import prisma from "@/lib/prisma";

export default async function DoctorReviews() {
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-1">Assessment queue</p>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
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
