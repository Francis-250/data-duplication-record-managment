"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { accountFlow } from "@/lib/account-flow-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DoctorOnboardingForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("verifyEmail") ?? "";
    const storedToken = sessionStorage.getItem("doctorRegistrationIntent") ?? "";
    queueMicrotask(() => {
      setEmail(storedEmail);
      setToken(storedToken);
    });
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        await accountFlow({
          operation: "complete-doctor-registration",
          token,
          email,
          specialization,
          hospitalName,
          licenseNumber,
          phoneNumber,
        });
        sessionStorage.removeItem("verifyEmail");
        sessionStorage.removeItem("registrationRole");
        sessionStorage.removeItem("doctorRegistrationIntent");
        router.replace("/auth/doctor-pending");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to submit profile.");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Verified email</Label>
        <Input value={email} disabled />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="specialization" className="text-xs">Specialization</Label>
        <Input id="specialization" required value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Neurology" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hospital" className="text-xs">Hospital or clinic</Label>
        <Input id="hospital" required value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Hospital name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="license" className="text-xs">Medical license number</Label>
        <Input id="license" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="License number" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-xs">Phone number</Label>
        <Input id="phone" type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+250..." />
      </div>
      {message && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{message}</p>}
      <Button type="submit" className="w-full" disabled={pending || !email || !token}>
        {pending ? "Submitting..." : "Submit for admin approval"}
      </Button>
    </form>
  );
}
