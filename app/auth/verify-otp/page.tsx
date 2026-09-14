"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function VerifyOTP() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("verifyEmail");
    if (storedEmail) {
      queueMicrotask(() => setEmail(storedEmail));
    } else {
      toast.error("Please register first");
      router.push("/auth/register");
    }

    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const pastedArray = pastedData.split("");
    const newOtp = [...otp];

    for (let i = 0; i < Math.min(pastedArray.length, 6); i++) {
      if (pastedArray[i].match(/[0-9]/)) {
        newOtp[i] = pastedArray[i];
      }
    }

    setOtp(newOtp);

    const lastFilledIndex = newOtp.findLastIndex((val) => val !== "");
    if (lastFilledIndex < 5 && inputRefs.current[lastFilledIndex + 1]) {
      inputRefs.current[lastFilledIndex + 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    if (!email) {
      toast.error("Email not found. Please register again.");
      router.push("/auth/register");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.emailOtp.verifyEmail({
        email: email,
        otp: otpCode,
      });

      if (error) {
        toast.error(error.message || "Invalid verification code");
        setLoading(false);
        return;
      }

      if (data) {
        toast.success("Email verified successfully!");
        const role = sessionStorage.getItem("registrationRole");
        if (role === "doctor") {
          router.push("/auth/doctor-onboarding");
        } else {
          sessionStorage.removeItem("verifyEmail");
          sessionStorage.removeItem("registrationRole");
          router.push("/auth/login");
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email not found. Please register again.");
      router.push("/auth/register");
      return;
    }

    setResendLoading(true);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "email-verification",
      });

      if (error) {
        toast.error(error.message || "Failed to resend code");
        setResendLoading(false);
        return;
      }

      toast.success(`New verification code sent to ${email}`);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
        {/* Left */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            StrokeCheck
          </p>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
            Verify Your <br /> Identity
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            We&apos;ve sent a 6-digit verification code to{" "}
            <span className="font-medium text-foreground">
              {email ?? "your email address"}
            </span>
            . Enter the code below to continue.
          </p>
          <p className="mt-10 text-sm text-muted-foreground">
            Didn&apos;t receive the code?{" "}
            <button
              onClick={handleResendCode}
              disabled={resendLoading}
              className="font-medium text-foreground underline underline-offset-4 disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend code"}
            </button>
          </p>
        </div>

        {/* Right */}
        <div className="w-full rounded-lg border p-8">
          <h2 className="text-xl font-semibold tracking-tight mb-6">
            Enter OTP
          </h2>

          {email && (
            <p className="mb-6 text-sm text-muted-foreground">
              Verifying:{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="mb-4 inline-block text-xs font-medium">
                Verification code
              </label>
              <div className="flex gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="h-14 w-full rounded-md border bg-background text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Enter the 6-digit code sent to {email ?? "your email"}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin" />
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Link href="/auth/login">
            <Button variant="outline" className="w-full text-sm">
              ← Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
