"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitStudentRecord, checkStudentPotentialDuplicate } from "@/actions/student/records";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function SubmitStudentRecordPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "Male",
    dateOfBirth: "",
    nationalId: "",
    passportNumber: "",
    registrationNumber: "",
    applicantNumber: "",
    email: "",
    phoneNumber: "",
    programme: "Bachelor of Science in Information Technology",
    department: "Information Technology",
    faculty: "Faculty of Computing & Information Technology",
    campus: "Main Campus",
    intake: "September Intake",
    academicYear: "2024/2025",
    address: "Central District",
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handlePreCheck = async () => {
    if (!formData.registrationNumber && !formData.nationalId && !formData.lastName) {
      toast.info("Enter a Registration Number, National ID, or Name to pre-check.");
      return;
    }

    try {
      const res = await checkStudentPotentialDuplicate({
        registrationNumber: formData.registrationNumber,
        nationalId: formData.nationalId,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (res.hasHighRiskDuplicate) {
        setDuplicateWarning(
          `Notice: ${res.potentialDuplicates.length} potentially matching record(s) already exist in the University registry. Submitting this record will trigger an automatic deduplication match for Registry Staff review.`
        );
        toast.warning("Potential existing duplicate record detected.");
      } else {
        setDuplicateWarning(null);
        toast.success("No duplicate record found. You may proceed with submission.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Pre-check failed.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First name and Last name are required.");
      return;
    }

    startTransition(async () => {
      try {
        await submitStudentRecord(formData);
        toast.success("Student record successfully submitted to University registry.");
        router.push("/student");
      } catch (err: any) {
        toast.error(err?.message || "Failed to submit student record.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/student">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Register Student Record</h2>
          <p className="text-xs text-muted-foreground">
            Submit your official student academic and personal information to the DATA DEDUPLICATION AND RECORD MATCHING SYSTEM registry.
          </p>
        </div>
      </div>

      {duplicateWarning && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Potential Duplicate Warning</p>
            <p className="mt-1 leading-relaxed">{duplicateWarning}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">1. Personal Identity</CardTitle>
            <CardDescription className="text-xs">
              Ensure spellings match your national identification or passport exactly.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs">First Name *</Label>
              <Input
                id="firstName"
                required
                placeholder="e.g. Jean"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="middleName" className="text-xs">Middle Name</Label>
              <Input
                id="middleName"
                placeholder="e.g. Paul"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs">Last / Family Name *</Label>
              <Input
                id="lastName"
                required
                placeholder="e.g. Habimana"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-xs">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(val) => setFormData({ ...formData, gender: val })}
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth" className="text-xs">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nationalId" className="text-xs">National ID Number (16 digits)</Label>
              <Input
                id="nationalId"
                placeholder="1 1998 8 0012345 0 12"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic & University Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">2. Institutional Enrollment</CardTitle>
            <CardDescription className="text-xs">
              Academic programme, campus, and enrollment credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="registrationNumber" className="text-xs">Registration Number</Label>
              <Input
                id="registrationNumber"
                placeholder="e.g. REG/2024/BIT/042"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="applicantNumber" className="text-xs">Applicant / Admission Number</Label>
              <Input
                id="applicantNumber"
                placeholder="e.g. APP-2024-912"
                value={formData.applicantNumber}
                onChange={(e) => setFormData({ ...formData, applicantNumber: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="programme" className="text-xs">Academic Programme</Label>
              <Input
                id="programme"
                placeholder="e.g. Bachelor of Science in Information Technology"
                value={formData.programme}
                onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="faculty" className="text-xs">Faculty</Label>
              <Input
                id="faculty"
                placeholder="e.g. Faculty of Computing & Information Technology"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campus" className="text-xs">Campus</Label>
              <Select
                value={formData.campus}
                onValueChange={(val) => setFormData({ ...formData, campus: val })}
              >
                <SelectTrigger id="campus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Campus">Main Campus</SelectItem>
                  <SelectItem value="North Campus">North Campus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="academicYear" className="text-xs">Academic Year</Label>
              <Input
                id="academicYear"
                placeholder="e.g. 2024/2025"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">3. Contact Information</CardTitle>
            <CardDescription className="text-xs">
              Official email and phone for communication.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@dedup.system"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-xs">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="e.g. +250 788 123 456"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address" className="text-xs">Residential Address</Label>
              <Input
                id="address"
                placeholder="District, Sector, City"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePreCheck}
            disabled={pending}
            className="w-full sm:w-auto"
          >
            <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Run Duplicate Pre-Check
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/student">Cancel</Link>
            </Button>
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? "Submitting Record..." : "Submit Record"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
