import { AdminDoctorFeedback } from "@/components/admin-doctor-feedback";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdminPage } from "@/lib/admin-auth";
import { formatAdminDateTime } from "@/lib/admin";
import prisma from "@/lib/prisma";

export default async function AdminFeedbackPage() {
  await requireAdminPage();
  const feedback = await prisma.doctorFeedback.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      patient: { select: { name: true } },
      doctorProfile: {
        select: { specialization: true, user: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <AdminPageHeader eyebrow="Patient experience" title="Doctor feedback" description="Review patient comments and take action on doctor accounts." />
      <AdminDoctorFeedback
        feedback={feedback.map((item) => ({
          id: item.id,
          patientName: item.patient.name,
          doctorName: item.doctorProfile.user.name,
          specialization: item.doctorProfile.specialization ?? "Doctor",
          comment: item.comment,
          status: item.status,
          adminNote: item.adminNote ?? undefined,
          createdAt: formatAdminDateTime(item.createdAt),
        }))}
      />
    </div>
  );
}
