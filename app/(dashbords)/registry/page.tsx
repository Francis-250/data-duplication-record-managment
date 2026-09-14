import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireRegistryPage } from "@/lib/registry-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Upload,
  GitCompare,
  CheckCheck,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default async function RegistryDashboard() {
  await requireRegistryPage();

  const [
    totalRecords,
    activeRecords,
    pendingCandidates,
    confirmedCandidates,
    mergedRecordsCount,
    recentMatchRuns,
  ] = await Promise.all([
    prisma.institutionalRecord.count(),
    prisma.institutionalRecord.count({ where: { status: "ACTIVE" } }),
    prisma.matchCandidate.count({ where: { reviewStatus: "PENDING" } }),
    prisma.matchCandidate.count({ where: { reviewStatus: "CONFIRMED" } }),
    prisma.recordMerge.count(),
    prisma.matchRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        datasetImport: { select: { originalFileName: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registry Operations Console</h2>
          <p className="text-sm text-muted-foreground mt-1">
            DATA DEDUPLICATION AND RECORD MATCHING SYSTEM · Candidate matching verification and master record consolidation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button asChild variant="outline" size="sm">
            <Link href="/registry/import">
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/registry/deduplication">
              <GitCompare className="mr-2 h-4 w-4" /> Run Deduplication
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Records
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeRecords} active entries in registry</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Reviews
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCandidates}</div>
            <p className="text-xs text-muted-foreground mt-1">Suggested matches awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Confirmed Matches
            </CardTitle>
            <CheckCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{confirmedCandidates}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for Registry Staff merging</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Merged Records
            </CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{mergedRecordsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Consolidated master records</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/registry/reviews"
          className="rounded-xl border bg-card p-5 transition-all hover:border-primary hover:shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-sm">Review Suggested Matches</p>
            <p className="text-xs text-muted-foreground mt-1">
              Side-by-side candidate comparison & classification review
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        <Link
          href="/registry/records"
          className="rounded-xl border bg-card p-5 transition-all hover:border-primary hover:shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-sm">Browse Student Records</p>
            <p className="text-xs text-muted-foreground mt-1">
              Search, filter by campus, programme, and status
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        <Link
          href="/registry/merged"
          className="rounded-xl border bg-card p-5 transition-all hover:border-primary hover:shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-sm">Merge History & Traceability</p>
            <p className="text-xs text-muted-foreground mt-1">
              Audit consolidated master records and source links
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Recent Deduplication Runs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent Deduplication Pipelines</CardTitle>
              <CardDescription className="text-xs">
                Historical record linkage runs, algorithm details, and matched candidate pairs.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/registry/deduplication">
                New Run <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentMatchRuns.length === 0 ? (
            <div className="text-center py-10 border rounded-lg border-dashed">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No deduplication runs executed yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Import a cohort dataset or launch your first deduplication run across active registry records.
              </p>
              <Button asChild size="sm">
                <Link href="/registry/deduplication">
                  <GitCompare className="mr-2 h-4 w-4" /> Run Deduplication
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Algorithm</TableHead>
                    <TableHead>Dataset Source</TableHead>
                    <TableHead>Records Evaluated</TableHead>
                    <TableHead>Candidate Pairs</TableHead>
                    <TableHead>Matches</TableHead>
                    <TableHead>Possible Matches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Executed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMatchRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium text-xs">
                        {run.algorithm}
                        <span className="block text-[10px] text-muted-foreground">{run.modelVersion}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {run.datasetImport?.originalFileName || "All Active Registry Records"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{run.recordsProcessed}</TableCell>
                      <TableCell className="text-xs font-mono">{run.candidatePairs}</TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-600">
                        {run.matchesFound}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-amber-600">
                        {run.possibleMatches}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            run.status === "COMPLETED"
                              ? "default"
                              : run.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(run.createdAt).toLocaleString()}
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
