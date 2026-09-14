"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reviewDoctorFeedback } from "@/actions/doctor-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Feedback = {
  id: string;
  patientName: string;
  doctorName: string;
  specialization: string;
  comment: string;
  status: "PENDING" | "RESOLVED";
  adminNote?: string;
  createdAt: string;
};

export function AdminDoctorFeedback({ feedback }: { feedback: Feedback[] }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const review = (feedbackId: string, action: "RESOLVE" | "REVOKE_APPROVAL") =>
    startTransition(async () => {
      try {
        await reviewDoctorFeedback({ feedbackId, action, adminNote: notes[feedbackId] });
        toast.success(action === "REVOKE_APPROVAL" ? "Feedback resolved and doctor approval revoked." : "Feedback resolved.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to review feedback.");
      }
    });

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <div key={item.id} className="rounded-lg border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{item.patientName} about {item.doctorName}</p>
              <p className="text-xs text-muted-foreground">{item.specialization} · {item.createdAt}</p>
            </div>
            <Badge variant={item.status === "PENDING" ? "destructive" : "secondary"}>{item.status}</Badge>
          </div>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{item.comment}</p>
          {item.status === "PENDING" ? (
            <div className="mt-4 space-y-3 border-t pt-4">
              <Textarea
                value={notes[item.id] ?? ""}
                onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                placeholder="Admin review note and action taken..."
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={pending} onClick={() => review(item.id, "RESOLVE")}>Resolve feedback</Button>
                <Button size="sm" variant="destructive" disabled={pending} onClick={() => review(item.id, "REVOKE_APPROVAL")}>
                  Revoke doctor approval
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">Admin action: {item.adminNote}</p>
          )}
        </div>
      ))}
      {feedback.length === 0 && <p className="rounded-lg border py-12 text-center text-sm text-muted-foreground">No patient feedback received.</p>}
    </div>
  );
}
