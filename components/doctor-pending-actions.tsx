"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function DoctorPendingActions() {
  const router = useRouter();

  const returnToLogin = async () => {
    await authClient.signOut();
    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <Button variant="outline" className="mt-6 w-full" onClick={returnToLogin}>
      Back to sign in
    </Button>
  );
}
