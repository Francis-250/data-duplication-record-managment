"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { runDeduplicationPipeline } from "@/actions/registry/deduplication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  GitCompare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function RegistryDeduplicationClient({
  imports,
  recentRuns,
  totalRecords,
}: {
  imports: any[];
  recentRuns: any[];
  totalRecords: number;
}) {
  const [selectedImportId, setSelectedImportId] = useState<string>("ALL");
  const [algorithm, setAlgorithm] = useState("Hybrid Fellegi-Sunter & Token Similarity");
  const [matchThreshold, setMatchThreshold] = useState("0.80");
  const [possibleThreshold, setPossibleThreshold] = useState("0.52");

  const [running, startPipeline] = useTransition();
  const [runResult, setRunResult] = useState<any | null>(null);

  const handleExecute = () => {
    if (totalRecords < 2) {
      toast.error("At least 2 active records are required in the registry to run deduplication.");
      return;
    }

    const mThresh = parseFloat(matchThreshold);
    const pThresh = parseFloat(possibleThreshold);

    if (isNaN(mThresh) || isNaN(pThresh) || pThresh >= mThresh) {
      toast.error("Invalid thresholds. Possible match threshold must be less than match threshold.");
      return;
    }

    startPipeline(async () => {
      try {
        const result = await runDeduplicationPipeline({
          datasetImportId: selectedImportId === "ALL" ? undefined : selectedImportId,
          algorithm,
          matchThreshold: mThresh,
          possibleThreshold: pThresh,
        });

        setRunResult(result);
        toast.success(
          `Deduplication completed! Found ${result.matchesFound} matches and ${result.possibleMatches} possible matches.`
        );
      } catch (err: any) {
        toast.error(err?.message || "Failed to execute deduplication pipeline.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Configure Record Deduplication & Matching Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Select matching algorithm and similarity thresholds. Candidate pairs will be generated via multi-pass phonetic and identifier blocking.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {totalRecords} Active Records in Scope
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Algorithm Select */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="algorithm" className="text-xs font-semibold">Matching Engine Algorithm</Label>
              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger id="algorithm" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hybrid Fellegi-Sunter & Token Similarity">
                    Hybrid Fellegi-Sunter & Token Similarity (Recommended)
                  </SelectItem>
                  <SelectItem value="Random Forest Matcher">
                    Random Forest Multi-Attribute Matcher
                  </SelectItem>
                  <SelectItem value="Logistic Regression Scoring">
                    Logistic Regression Probabilistic Linkage
                  </SelectItem>
                  <SelectItem value="Deterministic Rule-Based">
                    Deterministic Multi-Pass Rule-Based Matcher
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dataset Target Scope */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="scope" className="text-xs font-semibold">Target Dataset Scope</Label>
              <Select value={selectedImportId} onValueChange={setSelectedImportId}>
                <SelectTrigger id="scope" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Active Registry Records ({totalRecords} records)</SelectItem>
                  {imports.map((imp) => (
                    <SelectItem key={imp.id} value={imp.id}>
                      {imp.originalFileName} ({imp.validRows} rows)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Match Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="matchThreshold" className="text-xs font-semibold">Match Threshold</Label>
                <span className="font-mono text-[10px] text-muted-foreground">{matchThreshold}</span>
              </div>
              <Input
                id="matchThreshold"
                type="number"
                step="0.05"
                min="0.5"
                max="1.0"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Pairs at or above this score classify as MATCH</p>
            </div>

            {/* Possible Match Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="possibleThreshold" className="text-xs font-semibold">Possible Match Threshold</Label>
                <span className="font-mono text-[10px] text-muted-foreground">{possibleThreshold}</span>
              </div>
              <Input
                id="possibleThreshold"
                type="number"
                step="0.05"
                min="0.3"
                max="0.9"
                value={possibleThreshold}
                onChange={(e) => setPossibleThreshold(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Pairs between this and match score classify as POSSIBLE_MATCH</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleExecute} disabled={running} className="w-full sm:w-auto">
              <Zap className="mr-2 h-4 w-4" />
              {running ? "Processing Multi-Pass Deduplication..." : "Launch Deduplication Pipeline"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Execution Results Summary */}
      {runResult && (
        <Card className="border-primary/50">
          <CardHeader className="bg-primary/5 pb-3 rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Deduplication Pipeline Finished Successfully
                </CardTitle>
                <CardDescription className="text-xs">
                  Run ID: {runResult.matchRunId} · Multi-attribute field comparisons completed
                </CardDescription>
              </div>

              <Button asChild size="sm">
                <Link href="/registry/reviews">
                  Review Matching Candidates <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="border p-3 rounded-lg bg-card">
                <span className="text-[10px] uppercase text-muted-foreground block">Records Evaluated</span>
                <span className="text-xl font-bold font-mono">{runResult.recordsProcessed}</span>
              </div>
              <div className="border p-3 rounded-lg bg-card">
                <span className="text-[10px] uppercase text-muted-foreground block">Candidate Pairs</span>
                <span className="text-xl font-bold font-mono">{runResult.candidatePairs}</span>
              </div>
              <div className="border p-3 rounded-lg bg-emerald-500/10 text-emerald-950 dark:text-emerald-200">
                <span className="text-[10px] uppercase block">Matches</span>
                <span className="text-xl font-bold font-mono text-emerald-600">{runResult.matchesFound}</span>
              </div>
              <div className="border p-3 rounded-lg bg-amber-500/10 text-amber-950 dark:text-amber-200">
                <span className="text-[10px] uppercase block">Possible Matches</span>
                <span className="text-xl font-bold font-mono text-amber-600">{runResult.possibleMatches}</span>
              </div>
              <div className="border p-3 rounded-lg bg-muted/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase text-muted-foreground block">Non-Matches</span>
                <span className="text-xl font-bold font-mono text-muted-foreground">{runResult.nonMatches}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Deduplication Pipelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Previous Execution History</CardTitle>
          <CardDescription className="text-xs">
            Audit logs of previous runs, algorithms, and matching pairs discovered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <p className="text-sm font-medium">No previous deduplication runs on record</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Algorithm</TableHead>
                    <TableHead>Target Scope</TableHead>
                    <TableHead>Thresholds (Match / Poss)</TableHead>
                    <TableHead>Evaluated</TableHead>
                    <TableHead>Matches</TableHead>
                    <TableHead>Possible</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRuns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-xs">
                        {r.algorithm}
                        <span className="block text-[10px] text-muted-foreground">{r.modelVersion}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.datasetImport?.originalFileName || "All Active Registry"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {r.matchThreshold} / {r.possibleThreshold}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{r.recordsProcessed}</TableCell>
                      <TableCell className="text-xs font-bold text-emerald-600 font-mono">
                        {r.matchesFound}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-amber-600 font-mono">
                        {r.possibleMatches}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === "COMPLETED" ? "default" : "destructive"}
                          className="text-[10px]"
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
