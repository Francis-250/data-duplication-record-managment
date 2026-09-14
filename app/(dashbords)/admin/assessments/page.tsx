import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminAssessmentAssignments } from "@/components/admin-assessment-assignments";
import { requireAdminPage } from "@/lib/admin-auth";
import { formatAdminDateTime } from "@/lib/admin";
import prisma from "@/lib/prisma";

export default async function AdminAssessmentsPage() {
  await requireAdminPage();
  const [assessments, doctors] = await Promise.all([
    prisma.assessment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true } },
        doctorAssignment: { select: { doctorProfileId: true } },
      },
    }),
    prisma.doctorProfile.findMany({
      where: { isApprovedByAdmin: true, isVerified: true },
      orderBy: { user: { name: "asc" } },
      select: { id: true, specialization: true, user: { select: { name: true } } },
    }),
  ]);
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <AdminPageHeader eyebrow="Clinical oversight" title="Assessments" description="Review activity and assign approved doctors to patients." />
      <AdminAssessmentAssignments
        assessments={assessments.map((item) => ({
          id: item.id,
          patientName: item.user.name,
          email: item.user.email,
          createdAt: formatAdminDateTime(item.createdAt),
          riskLevel: item.riskLevel,
          confidence: Math.round(item.confidenceScore * 100),
          reviewed: item.reviewedByDoctor,
          assignedDoctorId: item.doctorAssignment?.doctorProfileId,
        }))}
        doctors={doctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.user.name,
          specialization: doctor.specialization ?? "Doctor",
        }))}
      />
    </div>
  );
}
