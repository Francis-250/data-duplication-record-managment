"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Brain,
  Eye,
  Footprints,
  Hand,
  HelpCircle,
  MessageCircle,
  RefreshCw,
  Smile,
  ThumbsDown,
} from "lucide-react";
import { createAssessment } from "@/actions/patient/assessments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const symptoms = [
  { id: "facial_drooping", label: "Facial drooping", icon: Smile, fast: true },
  { id: "arm_weakness", label: "Arm weakness", icon: Hand, fast: true },
  {
    id: "speech_difficulty",
    label: "Speech difficulty",
    icon: MessageCircle,
    fast: true,
  },
  { id: "blurred_vision", label: "Blurred vision", icon: Eye, fast: false },
  { id: "severe_headache", label: "Severe headache", icon: Brain, fast: false },
  { id: "dizziness", label: "Dizziness", icon: RefreshCw, fast: false },
  { id: "confusion", label: "Confusion", icon: HelpCircle, fast: false },
  { id: "numbness", label: "Numbness", icon: Activity, fast: false },
  {
    id: "loss_of_balance",
    label: "Loss of balance",
    icon: Footprints,
    fast: false,
  },
  { id: "nausea", label: "Nausea", icon: ThumbsDown, fast: false },
];

export default function Assessment() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((s) => s !== id) : [...p, id],
    );

  const fastCount = symptoms.filter(
    (s) => s.fast && selected.includes(s.id),
  ).length;
  const canSubmit = selected.length > 0 || text.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await createAssessment({
          symptoms: selected,
          symptomsText: text,
        });
        router.push(`/patient/assessment/${result.assessmentId}`);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to create assessment. Please try again.",
        );
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-1">New assessment</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your symptoms
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select every symptom you are experiencing right now
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 order-2 lg:order-1">
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              FAST score
            </p>
            <div className="flex gap-1.5 mb-3">
              {["F", "A", "S", "T"].map((l, i) => (
                <div
                  key={l}
                  className={cn(
                    "flex-1 h-9 rounded flex items-center justify-center text-xs font-bold transition-colors",
                    i < fastCount
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {fastCount === 0 && "No FAST symptoms selected"}
              {fastCount === 1 && "1 FAST symptom: monitor carefully"}
              {fastCount === 2 && "2 FAST symptoms: seek urgent care"}
              {fastCount >= 3 && "3+ FAST symptoms: call emergency services"}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              What is FAST?
            </p>
            <div className="space-y-2.5">
              {[
                { l: "F", t: "Face", d: "Is one side drooping?" },
                { l: "A", t: "Arms", d: "Can you raise both?" },
                { l: "S", t: "Speech", d: "Is it slurred?" },
                { l: "T", t: "Time", d: "Call emergency services" },
              ].map(({ l, t, d }) => (
                <div key={l} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded bg-muted text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {l}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{t}</span>:{" "}
                    {d}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed px-0.5">
            This tool does not replace a doctor. If you feel in danger, call
            emergency services immediately.
          </p>
        </div>

        <div className="lg:col-span-2 order-1 lg:order-2 space-y-5">
          <div className="rounded-lg border p-5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 block">
              Symptoms
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {symptoms.map(({ id, label, icon: Icon, fast }) => {
                const active = selected.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className={cn(
                      "relative flex min-h-10 items-center gap-2.5 px-3 py-2.5 rounded-md border text-sm transition-colors text-left",
                      active
                        ? "bg-primary/5 border-primary text-primary"
                        : "bg-background border-border text-foreground hover:bg-muted/50",
                    )}
                  >
                    {fast && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-blue-600 leading-none">
                        F
                      </span>
                    )}
                    <Icon
                      size={14}
                      className={
                        active ? "text-primary" : "text-muted-foreground"
                      }
                    />
                    <span className="text-xs">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <Label
              htmlFor="desc"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block"
            >
              Describe in your own words{" "}
              <span className="normal-case font-normal">(optional)</span>
            </Label>
            <Textarea
              id="desc"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="e.g. My left arm feels heavy and I have trouble forming words..."
              className="resize-none text-sm"
            />
          </div>

          {isPending && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-muted border-t-foreground animate-spin" />
                AI assessment in progress
              </div>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Running the clinical assessment and structured risk
                classification. This may take a few seconds.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {selected.length > 0
                ? `${selected.length} symptom${selected.length > 1 ? "s" : ""} selected`
                : "Nothing selected yet"}
            </p>
            <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
              {isPending ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin" />
              ) : (
                <>
                  <span>Analyze</span> <ArrowRight size={14} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
