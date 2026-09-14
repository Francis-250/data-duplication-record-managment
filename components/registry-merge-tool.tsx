"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mergeConfirmedRecords, getAiMergeSuggestions } from "@/actions/registry/deduplication";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Layers,
  ShieldCheck,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";

export function RegistryMergeTool({ candidate }: { candidate: any }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isAiSelecting, setIsAiSelecting] = useState(false);

  const recordA = candidate.recordA;
  const recordB = candidate.recordB;

  // Master selection: Record A or Record B (defaults to A)
  const [masterRecordId, setMasterRecordId] = useState(recordA.id);
  const [mergeReason, setMergeReason] = useState(
    "Confirmed identical student duplicate entries consolidated into master record."
  );

  const handleAiAutoSelect = async () => {
    setIsAiSelecting(true);
    try {
      const aiResult = await getAiMergeSuggestions(candidate.id);
      if (aiResult.recommendedMaster === "B") {
        setMasterRecordId(recordB.id);
      } else {
        setMasterRecordId(recordA.id);
      }

      setSelectedFields((prev) => ({
        ...prev,
        ...aiResult.recommendedValues,
      }));

      if (aiResult.mergeReason) {
        setMergeReason(aiResult.mergeReason);
      }

      toast.success("AI (openai/gpt-oss-120b) recommended best values and justification.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to get AI merge suggestions.");
    } finally {
      setIsAiSelecting(false);
    }
  };

  // Field selection state: For each field, which record value is preserved
  // Initialize with non-empty values preferring Record A
  const [selectedFields, setSelectedFields] = useState<Record<string, any>>({
    firstName: recordA.firstName || recordB.firstName || "",
    middleName: recordA.middleName || recordB.middleName || "",
    lastName: recordA.lastName || recordB.lastName || "",
    gender: recordA.gender || recordB.gender || "Male",
    dateOfBirth: recordA.dateOfBirth || recordB.dateOfBirth || "",
    nationalId: recordA.nationalId || recordB.nationalId || "",
    passportNumber: recordA.passportNumber || recordB.passportNumber || "",
    registrationNumber: recordA.registrationNumber || recordB.registrationNumber || "",
    applicantNumber: recordA.applicantNumber || recordB.applicantNumber || "",
    email: recordA.email || recordB.email || "",
    phoneNumber: recordA.phoneNumber || recordB.phoneNumber || "",
    programme: recordA.programme || recordB.programme || "",
    department: recordA.department || recordB.department || "",
    faculty: recordA.faculty || recordB.faculty || "",
    campus: recordA.campus || recordB.campus || "Main Campus",
    intake: recordA.intake || recordB.intake || "",
    academicYear: recordA.academicYear || recordB.academicYear || "",
    address: recordA.address || recordB.address || "",
  });

  const fieldsConfig = [
    { key: "firstName", label: "First Name" },
    { key: "middleName", label: "Middle Name" },
    { key: "lastName", label: "Last Name" },
    { key: "gender", label: "Gender" },
    { key: "dateOfBirth", label: "Date of Birth", isDate: true },
    { key: "registrationNumber", label: "Registration Number" },
    { key: "nationalId", label: "National ID / Passport" },
    { key: "email", label: "Email Address" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "programme", label: "Academic Programme" },
    { key: "campus", label: "Campus" },
    { key: "faculty", label: "Faculty" },
    { key: "academicYear", label: "Academic Year" },
    { key: "address", label: "Residential Address" },
  ];

  const handleSelectField = (fieldKey: string, value: any) => {
    setSelectedFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleExecuteMerge = () => {
    startTransition(async () => {
      try {
        await mergeConfirmedRecords({
          candidateId: candidate.id,
          masterRecordId,
          selectedValues: {
            ...selectedFields,
            fullName: [selectedFields.firstName, selectedFields.middleName, selectedFields.lastName]
              .filter(Boolean)
              .join(" "),
          },
          mergeReason,
        });

        toast.success("Duplicate records consolidated successfully into master record.");
        router.push("/registry/merged");
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Failed to execute merge operation.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/registry/review/${candidate.id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Side-by-Side Review
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Consolidate Duplicate Student Records</h2>
            <p className="text-xs text-muted-foreground">
              Candidate ID: {candidate.id} · Match Score: {(candidate.overallScore * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs">
          Status: {candidate.reviewStatus}
        </Badge>
      </div>

      {/* Non-Destructive Notice */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-xs text-foreground flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Non-Destructive Consolidation Policy</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            The system preserves both original records. One record will be maintained as the updated Master Record, while the other record is marked as MERGED with full bidirectional audit traceability. No academic history or identifiers are lost.
          </p>
        </div>
      </div>

      {/* Select Master Anchor Record */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">1. Choose Primary Master Record Anchor</CardTitle>
          <CardDescription className="text-xs">
            Select which existing institutional record ID should serve as the primary active master record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setMasterRecordId(recordA.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                masterRecordId === recordA.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:border-muted-foreground/40 bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-primary">Record A (Source 1)</span>
                {masterRecordId === recordA.id && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="font-semibold text-sm mt-2">{recordA.fullName}</p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                Reg No: {recordA.registrationNumber || "None"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Source: {recordA.recordSource || "Registry Entry"} · {recordA.campus}
              </p>
            </div>

            <div
              onClick={() => setMasterRecordId(recordB.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                masterRecordId === recordB.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:border-muted-foreground/40 bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-primary">Record B (Source 2)</span>
                {masterRecordId === recordB.id && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="font-semibold text-sm mt-2">{recordB.fullName}</p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                Reg No: {recordB.registrationNumber || "None"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Source: {recordB.recordSource || "Registry Entry"} · {recordB.campus}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field-by-Field Value Picker */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">2. Select Correct Values for Master Record</CardTitle>
              <CardDescription className="text-xs">
                Click on either Record A or Record B values to select which value will be preserved in the consolidated master record.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isAiSelecting || pending}
              onClick={handleAiAutoSelect}
              className="border-indigo-500/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              {isAiSelecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI Evaluating Fields...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                  AI Auto-Select Best Values (120B)
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {fieldsConfig.map(({ key, label, isDate }) => {
            const valA = recordA[key];
            const valB = recordB[key];

            const displayA = isDate && valA ? new Date(valA).toLocaleDateString() : valA;
            const displayB = isDate && valB ? new Date(valB).toLocaleDateString() : valB;

            const selectedVal = selectedFields[key];
            const isMatch = String(valA || "").trim().toLowerCase() === String(valB || "").trim().toLowerCase() && !!valA;

            const isAChosen = selectedVal === valA || (!valB && isMatch);
            const isBChosen = selectedVal === valB && !isAChosen;

            return (
              <div key={key} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2.5 rounded-lg border bg-card">
                <div className="md:col-span-3">
                  <span className="text-xs font-semibold">{label}</span>
                  {isMatch && (
                    <Badge variant="outline" className="ml-2 text-[9px] text-emerald-600 border-emerald-500/30">
                      Match
                    </Badge>
                  )}
                </div>

                {/* Option Record A */}
                <div
                  onClick={() => handleSelectField(key, valA)}
                  className={`md:col-span-4 p-2 rounded-md border text-xs cursor-pointer transition-all ${
                    isAChosen
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="block text-[9px] uppercase font-mono opacity-70">Record A</span>
                  <span className="truncate block">{displayA || <span className="italic">Empty</span>}</span>
                </div>

                {/* Option Record B */}
                <div
                  onClick={() => handleSelectField(key, valB)}
                  className={`md:col-span-4 p-2 rounded-md border text-xs cursor-pointer transition-all ${
                    isBChosen
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="block text-[9px] uppercase font-mono opacity-70">Record B</span>
                  <span className="truncate block">{displayB || <span className="italic">Empty</span>}</span>
                </div>

                {/* Manual Override Indicator */}
                <div className="md:col-span-1 text-center font-mono text-[10px] text-muted-foreground">
                  {isAChosen ? "Rec A" : isBChosen ? "Rec B" : "Custom"}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Merge Reason and Submission */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">3. Audit Justification & Confirmation</CardTitle>
          <CardDescription className="text-xs">
            Document reason for merge into official University audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Official Merge Reason</label>
            <Input
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
              placeholder="e.g. Confirmed duplicate student enrollment consolidated by Registry."
              className="text-xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/registry/review/${candidate.id}`}>Cancel</Link>
            </Button>

            <Button
              onClick={handleExecuteMerge}
              disabled={pending}
              className="bg-primary text-primary-foreground w-full sm:w-auto"
            >
              <Layers className="mr-2 h-4 w-4" />
              {pending ? "Executing Consolidation..." : "Execute Non-Destructive Merge"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
