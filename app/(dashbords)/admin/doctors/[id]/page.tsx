import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, Phone, ShieldCheck, Stethoscope } from "lucide-react";
import { AdminDoctorReviewActions } from "@/components/admin-doctor-review-actions";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/admin-auth";
import { formatAdminDateTime } from "@/lib/admin";
import prisma from "@/lib/prisma";

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="border-b py-3 last:border-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value || "Not provided"}</p>
    </div>
  );
}

export default async function AdminDoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          emailVerified: true,
          phoneNumber: true,
          phoneNumberVerified: true,
          image: true,
          createdAt: true,
          banned: true,
          twoFactorEnabled: true,
          sessions: { select: { id: true } },
        },
      },
      _count: { select: { comments: true } },
    },
  });
  if (!doctor) notFound();

  const rejected = !!doctor.approvalRejectedAt;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link href="/admin/doctors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft size={15} /> Doctors
      </Link>
      <div className="mt-5 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Doctor application</p>
          <h1 className="text-2xl font-semibold tracking-tight">{doctor.user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{doctor.specialization ?? "Specialization not provided"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={doctor.isApprovedByAdmin ? "secondary" : rejected ? "destructive" : "outline"}>
            {doctor.isApprovedByAdmin ? "Approved" : rejected ? "Rejected" : "Pending review"}
          </Badge>
          <Badge variant={doctor.isVerified ? "secondary" : "outline"}>
            {doctor.isVerified ? "Credentials verified" : "Credentials unverified"}
          </Badge>
        </div>
      </div>

      {rejected && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">Previous rejection reason</p>
          <p className="mt-1 text-sm text-muted-foreground">{doctor.approvalRejectionReason}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="rounded-lg border p-5 text-center">
          {doctor.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.user.image} alt="" className="mx-auto size-20 rounded-full object-cover" />
          ) : (
            <div className="mx-auto size-20 rounded-full bg-muted flex items-center justify-center">
              <Stethoscope size={24} className="text-muted-foreground" />
            </div>
          )}
          <p className="mt-4 text-base font-semibold">{doctor.user.name}</p>
          <p className="text-xs text-muted-foreground">{doctor.hospitalName ?? "Hospital not provided"}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Badge variant={doctor.user.emailVerified ? "secondary" : "outline"}><Mail size={11} /> Email</Badge>
            <Badge variant={doctor.user.phoneNumberVerified ? "secondary" : "outline"}><Phone size={11} /> Phone</Badge>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Professional credentials</p>
            <Detail label="Specialization" value={doctor.specialization} />
            <Detail label="Hospital or clinic" value={doctor.hospitalName} />
            <Detail label="Medical license number" value={doctor.licenseNumber} />
            <Detail label="Application submitted" value={formatAdminDateTime(doctor.createdAt)} />
          </div>

          <div className="rounded-lg border p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Account details</p>
            <Detail label="Email" value={doctor.user.email} />
            <Detail label="Phone number" value={doctor.user.phoneNumber} />
            <Detail label="Account created" value={formatAdminDateTime(doctor.user.createdAt)} />
            <Detail label="Active sessions" value={doctor.user.sessions.length} />
            <Detail label="Doctor comments submitted" value={doctor._count.comments} />
            <Detail label="Two-factor authentication" value={doctor.user.twoFactorEnabled ? "Enabled" : "Not enabled"} />
            <Detail label="Account status" value={doctor.user.banned ? "Suspended" : "Active"} />
          </div>

          <div className="rounded-lg border p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={15} />
              <p className="text-sm font-medium">Review decision</p>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Approval grants access to the doctor portal and marks the submitted credentials as verified. Rejection requires a reason visible to the doctor during login.
            </p>
            <AdminDoctorReviewActions profileId={doctor.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
