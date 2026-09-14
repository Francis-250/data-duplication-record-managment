"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DoctorAssessmentItem = {
  id: string;
  patientName: string;
  date: string;
  time: string;
  symptoms: string[];
  confidence: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  reviewed: boolean;
};

type Filter = "ALL" | "HIGH" | "MEDIUM" | "UNREVIEWED" | "REVIEWED";

const filters: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "HIGH", label: "High risk" },
  { value: "MEDIUM", label: "Medium risk" },
  { value: "UNREVIEWED", label: "Unreviewed" },
  { value: "REVIEWED", label: "Reviewed" },
];

const riskClasses = {
  HIGH: "border-destructive/30 bg-destructive/10 text-destructive",
  MEDIUM: "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  LOW: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
};

const barClasses = {
  HIGH: "bg-destructive",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-600",
};

export function DoctorAssessmentList({
  assessments,
}: {
  assessments: DoctorAssessmentItem[];
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const count = (value: Filter) =>
    assessments.filter((item) => {
      if (value === "ALL") return true;
      if (value === "UNREVIEWED") return !item.reviewed;
      if (value === "REVIEWED") return item.reviewed;
      return item.riskLevel === value;
    }).length;

  const visible = assessments.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "UNREVIEWED") return !item.reviewed;
    if (filter === "REVIEWED") return item.reviewed;
    return item.riskLevel === filter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="rounded-lg border p-3 lg:sticky lg:top-6">
        <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Filter
        </p>
        <div className="space-y-1">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                filter === value
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {label}
              <span className="text-xs text-muted-foreground">{count(value)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 rounded-lg border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="col-span-3">Patient</span>
          <span className="col-span-3">Symptoms</span>
          <span className="col-span-3">Confidence</span>
          <span className="col-span-3 text-right">Status</span>
        </div>
        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="mx-auto mb-3 text-muted-foreground/30" size={26} />
            <p className="text-sm font-medium text-muted-foreground">All caught up</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              No assessments match this filter.
            </p>
          </div>
        ) : (
          visible.map((item) => (
            <Link
              key={item.id}
              href={`/doctor/reviews/${item.id}`}
              className={cn(
                "grid grid-cols-12 gap-3 items-center border-b last:border-0 px-4 py-3.5 hover:bg-muted/50 transition-colors",
                !item.reviewed && "bg-muted/30",
              )}
            >
              <div className="col-span-7 md:col-span-3 min-w-0">
                <p className="text-sm font-medium truncate">{item.patientName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={10} /> {item.date}, {item.time}
                </p>
              </div>
              <div className="hidden md:flex col-span-3 flex-wrap gap-1">
                {item.symptoms.slice(0, 2).map((symptom) => (
                  <span key={symptom} className="rounded-sm bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {symptom}
                  </span>
                ))}
                {item.symptoms.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
              </div>
              <div className="hidden md:flex col-span-3 items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full", barClasses[item.riskLevel])} style={{ width: `${item.confidence}%` }} />
                </div>
                <span className="w-8 text-xs text-muted-foreground">{item.confidence}%</span>
              </div>
              <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-2">
                <Badge variant="outline" className={riskClasses[item.riskLevel]}>
                  {item.riskLevel.charAt(0) + item.riskLevel.slice(1).toLowerCase()}
                </Badge>
                <Badge variant={item.reviewed ? "secondary" : "outline"} className="hidden sm:inline-flex">
                  {item.reviewed ? "Reviewed" : "Unreviewed"}
                </Badge>
                <ChevronRight size={13} className="text-muted-foreground/50" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
