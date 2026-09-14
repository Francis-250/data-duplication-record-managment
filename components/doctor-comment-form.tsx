"use client";

import { useState, useTransition } from "react";
import { addDoctorComment } from "@/actions/doctor/reviews";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DoctorCommentForm({ assessmentId }: { assessmentId: string }) {
  const [comment, setComment] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        await addDoctorComment({ assessmentId, comment, isUrgent: urgent });
        setComment("");
        setUrgent(false);
        setMessage("Comment submitted.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to submit comment.");
      }
    });
  };

  return (
    <div className="rounded-lg border p-5">
      <p className="text-sm font-medium mb-4">Add comment</p>
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Add clinical notes or follow-up instructions..."
        rows={5}
        className="resize-none"
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox id="urgent" checked={urgent} onCheckedChange={(value) => setUrgent(!!value)} />
          <Label htmlFor="urgent" className="text-xs font-normal cursor-pointer">
            Mark as urgent
          </Label>
        </div>
        <Button onClick={submit} disabled={pending || !comment.trim()}>
          {pending ? "Submitting..." : "Submit comment"}
        </Button>
      </div>
      {message && <p className="mt-3 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
