"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { patientAssignDoctor } from "@/actions/assignments";
import { submitDoctorFeedback } from "@/actions/doctor-feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
};

export function PatientDoctorAssignment({
  assessmentId,
  doctors,
  assignedDoctorId,
  existingFeedback,
}: {
  assessmentId: string;
  doctors: Doctor[];
  assignedDoctorId?: string;
  existingFeedback?: string;
}) {
  const [doctorId, setDoctorId] = useState(assignedDoctorId ?? "");
  const [savedDoctorId, setSavedDoctorId] = useState(assignedDoctorId ?? "");
  const [comment, setComment] = useState(existingFeedback ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectedDoctor = doctors.find((doctor) => doctor.id === doctorId);
  const feedbackReady = Boolean(savedDoctorId && doctorId === savedDoctorId);

  const assign = () =>
    startTransition(async () => {
      try {
        setMessage(null);
        await patientAssignDoctor({ assessmentId, doctorProfileId: doctorId });
        setSavedDoctorId(doctorId);
        toast.success("Doctor assigned to this assessment.");
        setMessage("Doctor assignment saved. You can now send feedback to admin.");
      } catch (error) {
        const text = error instanceof Error ? error.message : "Unable to assign doctor.";
        toast.error(text);
        setMessage(text);
      }
    });

  const submitFeedback = () =>
    startTransition(async () => {
      try {
        setMessage(null);
        if (!feedbackReady) throw new Error("Assign this doctor before sending feedback.");
        await submitDoctorFeedback({ assessmentId, doctorProfileId: doctorId, comment });
        toast.success("Your feedback was sent to the admin team.");
        setMessage("Feedback sent to admin. It will appear in the admin feedback queue.");
      } catch (error) {
        const text = error instanceof Error ? error.message : "Unable to submit feedback.";
        toast.error(text);
        setMessage(text);
      }
    });

  return (
    <div className="rounded-lg border p-5 space-y-5">
      <div>
        <p className="text-sm font-medium">Assigned doctor</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose an approved doctor to review this assessment.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={doctorId} onValueChange={(value) => { setDoctorId(value); setMessage(null); }} disabled={pending}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Select approved doctor" /></SelectTrigger>
          <SelectContent>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                {doctor.name} · {doctor.specialization} · {doctor.hospital}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={assign} disabled={pending || !doctorId || doctorId === savedDoctorId}>
          {savedDoctorId ? "Reassign" : "Assign doctor"}
        </Button>
      </div>
      {selectedDoctor && (
        <p className="text-xs text-muted-foreground">
          Selected: {selectedDoctor.name}, {selectedDoctor.specialization} at {selectedDoctor.hospital}
        </p>
      )}
      {doctors.length === 0 && (
        <p className="text-xs text-muted-foreground">No approved doctors are currently available.</p>
      )}
      {message && (
        <p className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">{message}</p>
      )}
      {feedbackReady ? (
        <div className="space-y-2 border-t pt-5">
          <Label htmlFor="doctor-feedback">Comment about this doctor for administrators</Label>
          <Textarea
            id="doctor-feedback"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Describe your experience or concern..."
            rows={4}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters. Admins can use this feedback to review doctor access.
            </p>
          <Button type="button" variant="outline" onClick={submitFeedback} disabled={pending || comment.trim().length < 10}>
            Send feedback to admin
          </Button>
          </div>
        </div>
      ) : savedDoctorId && doctorId !== savedDoctorId ? (
        <p className="border-t pt-4 text-xs text-muted-foreground">
          Save the new doctor assignment before sending feedback.
        </p>
      ) : null}
    </div>
  );
}
