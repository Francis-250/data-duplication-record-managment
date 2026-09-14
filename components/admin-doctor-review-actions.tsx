"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reviewDoctorApplication } from "@/actions/admin/doctors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AdminDoctorReviewActions({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const review = (decision: "APPROVE" | "REJECT") => {
    setMessage(null);
    startTransition(async () => {
      try {
        await reviewDoctorApplication({ profileId, decision, reason });
        toast.success(decision === "APPROVE" ? "Doctor approved." : "Doctor application rejected.");
        setRejectOpen(false);
        router.refresh();
      } catch (error) {
        const text = error instanceof Error ? error.message : "Unable to review application.";
        setMessage(text);
        toast.error(text);
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => review("APPROVE")}>Approve doctor</Button>
        <Button variant="destructive" disabled={pending} onClick={() => setRejectOpen(true)}>Reject application</Button>
      </div>
      {message && <p className="mt-3 text-xs text-destructive">{message}</p>}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject doctor application</DialogTitle>
            <DialogDescription>
              The doctor will see this reason when they attempt to sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs">Rejection reason</Label>
            <Textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Explain what must be corrected..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={pending || !reason.trim()} onClick={() => review("REJECT")}>
              {pending ? "Rejecting..." : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
