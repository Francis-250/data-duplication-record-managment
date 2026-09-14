"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adminAssignDoctor } from "@/actions/assignments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Doctor = { id: string; name: string; specialization: string };
type Assessment = {
  id: string;
  patientName: string;
  email: string;
  createdAt: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  reviewed: boolean;
  assignedDoctorId?: string;
};

export function AdminAssessmentAssignments({
  assessments,
  doctors,
}: {
  assessments: Assessment[];
  doctors: Doctor[];
}) {
  const [selections, setSelections] = useState<Record<string, string>>(
    Object.fromEntries(assessments.map((item) => [item.id, item.assignedDoctorId ?? ""])),
  );
  const [pending, startTransition] = useTransition();

  const assign = (assessmentId: string) =>
    startTransition(async () => {
      try {
        await adminAssignDoctor({ assessmentId, doctorProfileId: selections[assessmentId] });
        toast.success("Assessment assignment updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to assign doctor.");
      }
    });

  return (
    <div className="rounded-lg border overflow-hidden divide-y">
      {assessments.map((item) => (
        <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center px-4 py-4">
          <div className="lg:col-span-3">
            <p className="text-sm font-medium">{item.patientName}</p>
            <p className="text-xs text-muted-foreground">{item.email} · {item.createdAt}</p>
          </div>
          <div className="lg:col-span-2 flex items-center gap-2">
            <Badge variant={item.riskLevel === "HIGH" ? "destructive" : "outline"}>{item.riskLevel}</Badge>
            <span className="text-xs text-muted-foreground">{item.confidence}%</span>
          </div>
          <div className="lg:col-span-5">
            <Select
              value={selections[item.id]}
              onValueChange={(value) => setSelections((current) => ({ ...current, [item.id]: value }))}
              disabled={pending}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Assign approved doctor" /></SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.specialization}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2 flex lg:justify-end items-center gap-2">
            <Badge variant={item.reviewed ? "secondary" : "outline"}>{item.reviewed ? "Reviewed" : "Unreviewed"}</Badge>
            <Button size="sm" disabled={pending || !selections[item.id]} onClick={() => assign(item.id)}>Assign</Button>
          </div>
        </div>
      ))}
      {assessments.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No assessments found.</p>}
    </div>
  );
}
