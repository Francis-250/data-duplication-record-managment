"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/auth/reset-password",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Reset link sent to your email!");
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
            Forgot Your <br /> Password?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            Don&apos;t worry! Enter your email address and we&apos;ll send you a
            link to reset your password.
          </p>
          <p className="mt-10 text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Back to sign in
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
              <Label htmlFor="email" className="text-xs">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="youremail@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll send a reset link to this email address
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin" />
              ) : (
                "Send reset link"
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
