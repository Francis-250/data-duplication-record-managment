"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { accountFlow } from "@/lib/account-flow-client";

type PostLoginDestination = {
  destination: string;
  blocked: boolean;
  reason: string | null;
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error) {
        const message = error.message || "Invalid email or password.";
        setLoginError(message);
        toast.error(message);
        return;
      }
      if (data) {
        const access = await accountFlow<PostLoginDestination>({
          operation: "post-login-destination",
        });
        if (access.blocked) {
          await authClient.signOut();
          const message =
            access.reason ??
            "Your doctor account is waiting for administrator approval.";
          setLoginError(message);
          toast.error(message);
        }
        router.push(access.destination);
        router.refresh();
      }
    } catch {
      const message = "Unable to sign in. Please try again.";
      setLoginError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/auth/callback",
      });
      if (error) toast.error(error?.message || "Failed to sign in with Google");
    } catch {
      toast.error("Something went wrong");
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
            Early detection <br /> saves lives
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            Sign in to access your AI-powered stroke symptom assessment dashboard and track your health history.
          </p>
          <p className="mt-10 text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/auth/register" className="font-medium text-foreground underline underline-offset-4">
              Register here
            </Link>
          </p>
        </div>

        {/* Right */}
        <div className="w-full rounded-lg border p-8">
          <h2 className="text-xl font-semibold tracking-tight mb-6">Sign in</h2>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(!!v)}
                />
                <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer font-normal">
                  Remember me
                </Label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? <span className="h-3.5 w-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                : "Sign in"
              }
            </Button>
            {loginError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {loginError}
              </p>
            )}
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Button variant="outline" className="w-full text-sm" onClick={handleGoogle}>
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" viewBox="0 0 512 512" aria-hidden="true">
              <path fill="#fbbd00" d="M120 256c0-25.367 6.989-49.13 19.131-69.477v-86.308H52.823C18.568 144.703 0 198.922 0 256s18.568 111.297 52.823 155.785h86.308v-86.308C126.989 305.13 120 281.367 120 256z"/>
              <path fill="#0f9d58" d="m256 392-60 60 60 60c57.079 0 111.297-18.568 155.785-52.823v-86.216h-86.216C305.044 385.147 281.181 392 256 392z"/>
              <path fill="#31aa52" d="m139.131 325.477-86.308 86.308a260.085 260.085 0 0 0 22.158 25.235C123.333 485.371 187.62 512 256 512V392c-49.624 0-93.117-26.72-116.869-66.523z"/>
              <path fill="#3c79e6" d="M512 256a258.24 258.24 0 0 0-4.192-46.377l-2.251-12.299H256v120h121.452a135.385 135.385 0 0 1-51.884 55.638l86.216 86.216a260.085 260.085 0 0 0 25.235-22.158C485.371 388.667 512 324.38 512 256z"/>
              <path fill="#cf2d48" d="m352.167 159.833 10.606 10.606 84.853-84.852-10.606-10.606C388.668 26.629 324.381 0 256 0l-60 60 60 60c36.326 0 70.479 14.146 96.167 39.833z"/>
              <path fill="#eb4132" d="M256 120V0C187.62 0 123.333 26.629 74.98 74.98a259.849 259.849 0 0 0-22.158 25.235l86.308 86.308C162.883 146.72 206.376 120 256 120z"/>
            </svg>
            Sign in with Google
          </Button>
        </div>

      </div>
    </main>
  );
}
