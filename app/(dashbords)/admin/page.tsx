import Link from "next/link";
import { getAdminReports } from "@/actions/admin/operations";
import { requireAdminPage } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  GitCompare,
  CheckCheck,
  Layers,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  BarChart3,
} from "lucide-react";

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const reports = await getAdminReports();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Institutional Deduplication Overview</h2>
          <p className="text-xs text-muted-foreground mt-1">
            University of Kigali · Comprehensive record analysis, duplicate detection reports, and system monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/model-evaluation">
              <Sparkles className="mr-1.5 h-4 w-4 text-primary" /> Model Evaluation
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/audit">
              <Clock className="mr-1.5 h-4 w-4" /> Activity Log
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Total Records</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono">{reports.totalRecords}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{reports.activeRecords} active entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Analyzed</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-primary">{reports.totalRecordsAnalyzed}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{reports.totalMatchRuns} pipeline runs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Potential Duplicates</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-amber-600">{reports.potentialDuplicates}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Matched candidate pairs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Confirmed Matches</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-emerald-600">{reports.confirmedMatches}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Verified by Registry Staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Merged Records</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-blue-600">{reports.mergedRecordsCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Consolidated master records</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-semibold">Possible Matches</p>
            <p className="text-xl font-bold font-mono text-amber-500 mt-1">{reports.possibleMatches}</p>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-500/70" />
        </div>

        <div className="rounded-lg border bg-card p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-semibold">Waiting For Review</p>
            <p className="text-xl font-bold font-mono text-blue-500 mt-1">{reports.waitingForReview}</p>
          </div>
          <Clock className="h-5 w-5 text-blue-500/70" />
        </div>

        <div className="rounded-lg border bg-card p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-semibold">Rejected Matches</p>
            <p className="text-xl font-bold font-mono text-destructive mt-1">{reports.rejectedMatches}</p>
          </div>
          <XCircle className="h-5 w-5 text-destructive/70" />
        </div>

        <div className="rounded-lg border bg-card p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-semibold">Audit Events Logged</p>
            <p className="text-xl font-bold font-mono mt-1">{reports.auditLogsCount}</p>
          </div>
          <ShieldAlert className="h-5 w-5 text-muted-foreground/70" />
        </div>
      </div>

      {/* Timeline Chart and Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Matching Results Activity Timeline (Last 7 Days)</CardTitle>
              <CardDescription className="text-xs">
                Volume of candidate pairs classified as MATCH, POSSIBLE_MATCH, and completed merges.
              </CardDescription>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 pt-2">
            {reports.timelineData.map((d) => (
              <div key={d.date} className="flex flex-col items-center p-2 rounded-lg border bg-muted/20 text-center">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                </span>
                <div className="my-2 space-y-1 w-full">
                  <div className="text-xs font-bold text-emerald-600 font-mono">
                    {d.matches} <span className="text-[9px] font-normal text-muted-foreground">M</span>
                  </div>
                  <div className="text-xs font-bold text-amber-600 font-mono">
                    {d.possible} <span className="text-[9px] font-normal text-muted-foreground">P</span>
                  </div>
                  <div className="text-xs font-bold text-primary font-mono">
                    {d.merged} <span className="text-[9px] font-normal text-muted-foreground">Cons</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Deduplication Runs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent Execution Pipelines</CardTitle>
              <CardDescription className="text-xs">
                Recent deduplication pipeline operations across university cohorts.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/settings">
                Algorithm Settings <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reports.recentMatchRuns.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No pipelines executed yet.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Algorithm</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Matches</TableHead>
                    <TableHead>Possible</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.recentMatchRuns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-xs">{r.algorithm}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.datasetImport?.originalFileName || "All Active Registry"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.recordsProcessed}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-600">{r.matchesFound}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-amber-600">{r.possibleMatches}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "COMPLETED" ? "default" : "destructive"} className="text-[10px]">
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
