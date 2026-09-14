"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reviewMatchCandidate, getAiCandidateAnalysis } from "@/actions/registry/deduplication";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
  Bot,
  Loader2,
  Check,
} from "lucide-react";

export function RegistrySideBySideReview({ candidate }: { candidate: any }) {
  const router = useRouter();
  const [reviewNote, setReviewNote] = useState(candidate.reviewNote || "");
  const [pending, startTransition] = useTransition();
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  const handleRunAiAnalysis = async () => {
    setIsAnalyzingAi(true);
    try {
      const result = await getAiCandidateAnalysis(candidate.id);
      setAiAnalysis(result);
      toast.success("AI analysis completed successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to run AI analysis.");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const recordA = candidate.recordA;
  const recordB = candidate.recordB;
  const comparisons = candidate.fieldComparisons || [];

  const handleDecision = (decision: "CONFIRMED" | "REJECTED") => {
    startTransition(async () => {
      try {
        await reviewMatchCandidate(candidate.id, decision, reviewNote);
        toast.success(`Pair successfully marked as ${decision}.`);
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Failed to submit review decision.");
      }
    });
  };

  // Attributes to compare side by side
  const fields = [
    { key: "fullName", label: "Full Name" },
    { key: "firstName", label: "First Name" },
    { key: "middleName", label: "Middle Name" },
    { key: "lastName", label: "Last Name" },
    { key: "registrationNumber", label: "Registration No" },
    { key: "nationalId", label: "National ID / Passport" },
    { key: "dateOfBirth", label: "Date of Birth", isDate: true },
    { key: "gender", label: "Gender" },
    { key: "email", label: "Email Address" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "programme", label: "Programme" },
    { key: "campus", label: "Campus" },
    { key: "academicYear", label: "Academic Year" },
    { key: "recordSource", label: "Record Source" },
  ];

  const getComparisonForField = (fieldName: string) => {
    return comparisons.find((c: any) => c.fieldName === fieldName);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/registry/reviews">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Reviews
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Side-by-Side Matching Verification</h2>
            <p className="text-xs text-muted-foreground">
              Candidate ID: {candidate.id} · Algorithm: {candidate.algorithm} ({candidate.modelVersion})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={candidate.classification === "MATCH" ? "default" : "secondary"}
            className="text-xs"
          >
            {candidate.classification}
          </Badge>
          <Badge
            variant={
              candidate.reviewStatus === "CONFIRMED"
                ? "default"
                : candidate.reviewStatus === "MERGED"
                ? "outline"
                : candidate.reviewStatus === "REJECTED"
                ? "destructive"
                : "secondary"
            }
            className="text-xs"
          >
            {candidate.reviewStatus}
          </Badge>
        </div>
      </div>

      {/* Summary Score Card */}
      <Card className="border-primary/40">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2 space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Explanation & Evidence</p>
              <p className="text-sm leading-relaxed">{candidate.explanation}</p>
            </div>

            <div className="border p-3 rounded-lg text-center bg-card">
              <span className="text-[10px] uppercase text-muted-foreground block">Overall Similarity</span>
              <span className="text-2xl font-bold font-mono text-primary">
                {(candidate.overallScore * 100).toFixed(1)}%
              </span>
            </div>

            <div className="border p-3 rounded-lg text-center bg-card">
              <span className="text-[10px] uppercase text-muted-foreground block">Model Confidence</span>
              <span className="text-2xl font-bold font-mono">
                {(candidate.confidenceScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Deep Analysis Section (Powered by GROQ_MODEL openai/gpt-oss-120b) */}
      <Card className="border-indigo-500/40 bg-gradient-to-r from-indigo-950/10 via-background to-blue-950/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-base font-semibold">AI Entity Resolution & Match Analysis</CardTitle>
                <Badge variant="outline" className="text-[10px] border-indigo-500/50 text-indigo-600 dark:text-indigo-400 font-mono">
                  openai/gpt-oss-120b
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Deep linguistic & identity evaluation using Groq&apos;s 120B reasoning model to assess name variations, Rwandan ID slips, and registration discrepancies.
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={isAnalyzingAi}
              onClick={handleRunAiAnalysis}
              className="border-indigo-500/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              {isAnalyzingAi ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing with 120B AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                  Run AI Deep Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {aiAnalysis && (
          <CardContent className="space-y-4 pt-1 border-t border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">AI Duplicate Verdict</span>
                <Badge
                  className={`mt-1 font-semibold ${
                    aiAnalysis.duplicateVerdict === "DEFINITE_DUPLICATE"
                      ? "bg-emerald-600 text-white"
                      : aiAnalysis.duplicateVerdict === "PROBABLE_DUPLICATE"
                      ? "bg-blue-600 text-white"
                      : aiAnalysis.duplicateVerdict === "DISTINCT_INDIVIDUALS"
                      ? "bg-rose-600 text-white"
                      : "bg-amber-600 text-white"
                  }`}
                >
                  {aiAnalysis.duplicateVerdict.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">AI Confidence Score</span>
                <span className="text-xl font-bold font-mono text-primary mt-1 block">
                  {(aiAnalysis.aiConfidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-3 rounded-lg border bg-card/60">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Suggested Master Record</span>
                <span className="text-sm font-bold mt-1 block text-indigo-600 dark:text-indigo-400">
                  {aiAnalysis.suggestedMasterRecord === "RECORD_B" ? "Record B (Candidate)" : "Record A (Primary)"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 bg-card/40 p-3 rounded-lg border">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Reasoning Summary</span>
              <p className="text-xs leading-relaxed text-foreground/90">{aiAnalysis.reasoningSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5 p-3 rounded-lg border bg-card/40">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Key Agreements:</span>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                  {aiAnalysis.keyAgreements.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border bg-card/40">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Discrepancy Analysis:</span>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                  {aiAnalysis.discrepancyAnalysis.length > 0 ? (
                    aiAnalysis.discrepancyAnalysis.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))
                  ) : (
                    <li>No significant conflicting attributes detected.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">Recommended Action:</span>
              <p className="text-xs text-foreground/90">{aiAnalysis.mergeRecommendation}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Side-by-Side Attributes Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Side-by-Side Field Comparison</CardTitle>
          <CardDescription className="text-xs">
            Matching attributes are highlighted in emerald, while differing or missing attributes are highlighted in amber.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40 font-semibold">Attribute</TableHead>
                  <TableHead className="font-semibold text-foreground">Record A (Source 1)</TableHead>
                  <TableHead className="font-semibold text-foreground">Record B (Source 2)</TableHead>
                  <TableHead className="w-28 text-right font-semibold">Similarity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map(({ key, label, isDate }) => {
                  let valA = recordA[key];
                  let valB = recordB[key];

                  if (isDate) {
                    valA = valA ? new Date(valA).toLocaleDateString() : null;
                    valB = valB ? new Date(valB).toLocaleDateString() : null;
                  }

                  const comp = getComparisonForField(key);
                  const isIdentical = String(valA || "").trim().toLowerCase() === String(valB || "").trim().toLowerCase() && !!valA;
                  const isPartial = comp && comp.similarityScore >= 0.70 && !isIdentical;

                  return (
                    <TableRow
                      key={key}
                      className={
                        isIdentical
                          ? "bg-emerald-500/5 dark:bg-emerald-500/10"
                          : isPartial
                          ? "bg-amber-500/5 dark:bg-amber-500/10"
                          : ""
                      }
                    >
                      <TableCell className="font-medium text-xs text-muted-foreground">
                        {label}
                      </TableCell>

                      <TableCell className="text-xs">
                        <span className={isIdentical ? "font-semibold text-emerald-950 dark:text-emerald-200" : ""}>
                          {valA || <span className="text-muted-foreground italic">Missing</span>}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs">
                        <span className={isIdentical ? "font-semibold text-emerald-950 dark:text-emerald-200" : ""}>
                          {valB || <span className="text-muted-foreground italic">Missing</span>}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        {comp ? (
                          <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
                            <span
                              className={`font-semibold ${
                                comp.similarityScore >= 0.85
                                  ? "text-emerald-600"
                                  : comp.similarityScore >= 0.55
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {(comp.similarityScore * 100).toFixed(0)}%
                            </span>
                            {comp.isExactMatch && <Check className="h-3 w-3 text-emerald-600 inline" />}
                          </div>
                        ) : isIdentical ? (
                          <span className="font-mono text-xs text-emerald-600 font-semibold">100%</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">--</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Decision & Action Card */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Registry Staff Review Decision</CardTitle>
          <CardDescription className="text-xs">
            Review the evidence above and confirm whether these two records belong to the same student. Only confirmed matches can proceed to the merging tool.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Reviewer Notes (Optional audit explanation)</label>
            <Textarea
              placeholder="e.g. Confirmed: Student re-registered after intake transfer with minor spelling variation."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="text-xs min-h-20"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={pending || candidate.reviewStatus === "MERGED"}
                onClick={() => handleDecision("REJECTED")}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject Match
              </Button>

              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={pending || candidate.reviewStatus === "MERGED"}
                onClick={() => handleDecision("CONFIRMED")}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Confirm Match
              </Button>
            </div>

            {candidate.reviewStatus === "CONFIRMED" && (
              <Button asChild className="bg-primary text-primary-foreground">
                <Link href={`/registry/merge/${candidate.id}`}>
                  <Layers className="mr-2 h-4 w-4" /> Proceed to Merge Duplicate Records
                </Link>
              </Button>
            )}

            {candidate.reviewStatus === "MERGED" && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                This pair has already been merged into a master record.
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
