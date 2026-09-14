import { AdminDoctorsClient } from "@/components/admin-doctors-client";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdminPage } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export default async function AdminDoctorsPage() {
  await requireAdminPage();
  const doctors = await prisma.doctorProfile.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } }, _count: { select: { comments: true } } } });
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10"><AdminPageHeader eyebrow="Clinical team" title="Doctors" description="Approve profiles and verify medical credentials." /><AdminDoctorsClient doctors={doctors.map((doctor) => ({ id: doctor.id, name: doctor.user.name, email: doctor.user.email, specialization: doctor.specialization ?? "Not set", hospital: doctor.hospitalName ?? "Hospital not set", license: doctor.licenseNumber ?? "Not set", approved: doctor.isApprovedByAdmin, verified: doctor.isVerified, comments: doctor._count.comments }))} /></div>;
}
