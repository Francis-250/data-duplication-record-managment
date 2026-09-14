"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset successfully!");
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
            Create New <br /> Password
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            Your new password must be different from your previously used
            passwords and should be at least 8 characters long.
          </p>
          <p className="mt-10 text-sm text-muted-foreground">
            <Link
              href="/auth/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              ← Back to sign in
            </Link>
          </p>
        </div>

        {/* Right */}
        <div className="w-full rounded-lg border p-8">
          <h2 className="text-xl font-semibold tracking-tight mb-6">
            Reset password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs">
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-medium">Password requirements:</p>
              <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin" />
              ) : (
                "Reset password"
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

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="h-5 w-5 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
