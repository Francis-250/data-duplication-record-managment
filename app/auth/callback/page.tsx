"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { accountFlow } from "@/lib/account-flow-client";

type PostLoginDestination = {
  destination: string;
  blocked: boolean;
  reason: string | null;
};

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: session, error: sessionError } =
          await authClient.getSession();

        if (sessionError) {
          setError("Failed to get session");
          setTimeout(() => router.push("/auth/login"), 2000);
          return;
        }

        if (session) {
          const access = await accountFlow<PostLoginDestination>({
            operation: "post-login-destination",
          });
          if (access.blocked) await authClient.signOut();
          router.replace(access.destination);
        } else {
          setError("No session found");
          setTimeout(() => router.push("/auth/login"), 2000);
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("An error occurred");
        setTimeout(() => router.push("/auth/login"), 2000);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <p className="text-sm text-slate-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
