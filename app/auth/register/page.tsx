"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Building2, Layers } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "REGISTRY_STAFF" | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the Terms & Institutional Policy");
      return;
    }

    setLoading(true);

    try {
      const verificationEmail = email.trim().toLowerCase();
      const roleToAssign = selectedRole ?? "STUDENT";

      const { data, error } = await authClient.signUp.email({
        email: verificationEmail,
        password,
        name,
        callbackURL: "/auth/verify-otp",
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        sessionStorage.setItem("verifyEmail", verificationEmail);
        sessionStorage.setItem("registrationRole", roleToAssign);

        const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
          email: verificationEmail,
          type: "email-verification",
        });

        if (otpError) {
          toast.error(
            otpError.message ||
              `Account created, but verification code could not be sent to ${verificationEmail}.`,
          );
          router.push("/auth/verify-otp");
          return;
        }

        toast.success(`Verification code sent to ${verificationEmail}`);
        router.push("/auth/verify-otp");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-muted/20">
        <div className="w-full max-w-4xl">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background text-xs font-medium text-muted-foreground mb-4">
              <Layers size={14} className="text-primary" /> DATA DEDUPLICATION AND RECORD MATCHING SYSTEM
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Record Deduplication & Matching System
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Select your institutional role to create your portal access account.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <button
              onClick={() => setSelectedRole("STUDENT")}
              className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Student</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submit record, search allowed records & verify potential duplicate records
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("REGISTRY_STAFF")}
              className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Registry Staff</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Import CSV datasets, run deduplication algorithms, review matches & merge records
                </p>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already registered?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Sign in to your portal
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-muted/20">
      <div className="w-full max-w-5xl">
        <button
          onClick={() => setSelectedRole(null)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to role selection
        </button>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background text-xs font-medium text-muted-foreground mb-4">
              <Layers size={14} className="text-primary" /> DATA DEDUPLICATION AND RECORD MATCHING SYSTEM
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-4">
              {selectedRole === "STUDENT"
                ? "Student Portal Registration"
                : "Registry Staff Registration"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedRole === "STUDENT"
                ? "Create your student access account to submit your institutional academic record, check pre-registration status, and review allowed directory records."
                : "Register for registry staff credentials to import institutional student cohorts, run multi-algorithm deduplication pipelines, and review matching candidate pairs."}
            </p>
          </div>

          <div className="w-full rounded-xl border bg-card p-8 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight mb-6">
              {selectedRole === "STUDENT" ? "Student" : "Registry Staff"} Account Information
            </h2>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Jean Paul Habimana"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Institutional / Personal Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@dedup.system or personal email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(!!v)}
                />
                <Label
                  htmlFor="terms"
                  className="text-xs text-muted-foreground cursor-pointer font-normal"
                >
                  I agree to the Institutional Data Protection and Registry Regulations
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                ) : (
                  `Create ${selectedRole === "STUDENT" ? "Student" : "Registry"} Account`
                )}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
