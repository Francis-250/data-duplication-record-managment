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
import { User, Stethoscope } from "lucide-react";
import { accountFlow } from "@/lib/account-flow-client";

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | null>(
    null,
  );

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
      toast.error("Please accept the Terms & Conditions");
      return;
    }

    setLoading(true);

    try {
      const verificationEmail = email.trim().toLowerCase();
      const doctorIntent =
        selectedRole === "doctor"
          ? (
              await accountFlow<{ token: string }>({
                operation: "create-doctor-intent",
                email: verificationEmail,
              })
            ).token
          : null;
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
        if (doctorIntent) {
          await accountFlow({
            operation: "start-doctor-registration",
            email: verificationEmail,
            token: doctorIntent,
          });
        }
        sessionStorage.setItem("verifyEmail", verificationEmail);
        sessionStorage.setItem("registrationRole", selectedRole ?? "patient");
        if (doctorIntent) {
          sessionStorage.setItem("doctorRegistrationIntent", doctorIntent);
        } else {
          sessionStorage.removeItem("doctorRegistrationIntent");
        }
        const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
          email: verificationEmail,
          type: "email-verification",
        });

        if (otpError) {
          toast.error(
            otpError.message ||
              `Account created, but the code could not be sent to ${verificationEmail}.`,
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

  const handleGoogleSignUp = async () => {
    if (selectedRole === "doctor") {
      toast.error(
        "Doctor registration requires email and password so credentials can be submitted for approval.",
      );
      return;
    }

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/auth/callback",
      });

      if (error) {
        toast.error(error.message);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (!selectedRole) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              StrokeCheck
            </p>
            <h1 className="text-4xl font-semibold tracking-tight mb-4">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose your role to get started
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <button
              onClick={() => setSelectedRole("patient")}
              className="flex flex-col items-center gap-4 rounded-lg border p-8 text-center transition-all hover:border-foreground hover:bg-accent"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Patient</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Assess symptoms, track health
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("doctor")}
              className="flex flex-col items-center gap-4 rounded-lg border p-8 text-center transition-all hover:border-foreground hover:bg-accent"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Stethoscope className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Doctor</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review assessments, consult
                </p>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <button
          onClick={() => setSelectedRole(null)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to role selection
        </button>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          {/* Left */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              StrokeCheck
            </p>
            <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
              {selectedRole === "patient"
                ? "Patient Registration"
                : "Doctor Registration"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fill in your details below to create your account and start using
              our AI-powered stroke assessment platform.
            </p>
          </div>

          {/* Right */}
          <div className="w-full rounded-lg border p-8">
            <h2 className="text-xl font-semibold tracking-tight mb-6">
              {selectedRole === "patient" ? "Patient" : "Doctor"} Information
            </h2>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
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
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-foreground underline underline-offset-4"
                  >
                    Terms & Conditions
                  </a>
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                ) : (
                  `Create ${selectedRole === "patient" ? "Patient" : "Doctor"} Account`
                )}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={handleGoogleSignUp}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4 mr-2"
                viewBox="0 0 512 512"
                aria-hidden="true"
              >
                <path
                  fill="#fbbd00"
                  d="M120 256c0-25.367 6.989-49.13 19.131-69.477v-86.308H52.823C18.568 144.703 0 198.922 0 256s18.568 111.297 52.823 155.785h86.308v-86.308C126.989 305.13 120 281.367 120 256z"
                />
                <path
                  fill="#0f9d58"
                  d="m256 392-60 60 60 60c57.079 0 111.297-18.568 155.785-52.823v-86.216h-86.216C305.044 385.147 281.181 392 256 392z"
                />
                <path
                  fill="#31aa52"
                  d="m139.131 325.477-86.308 86.308a260.085 260.085 0 0 0 22.158 25.235C123.333 485.371 187.62 512 256 512V392c-49.624 0-93.117-26.72-116.869-66.523z"
                />
                <path
                  fill="#3c79e6"
                  d="M512 256a258.24 258.24 0 0 0-4.192-46.377l-2.251-12.299H256v120h121.452a135.385 135.385 0 0 1-51.884 55.638l86.216 86.216a260.085 260.085 0 0 0 25.235-22.158C485.371 388.667 512 324.38 512 256z"
                />
                <path
                  fill="#cf2d48"
                  d="m352.167 159.833 10.606 10.606 84.853-84.852-10.606-10.606C388.668 26.629 324.381 0 256 0l-60 60 60 60c36.326 0 70.479 14.146 96.167 39.833z"
                />
                <path
                  fill="#eb4132"
                  d="M256 120V0C187.62 0 123.333 26.629 74.98 74.98a259.849 259.849 0 0 0-22.158 25.235l86.308 86.308C162.883 146.72 206.376 120 256 120z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
