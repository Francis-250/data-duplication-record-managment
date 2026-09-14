import Link from "next/link";
import { getMergedRecords } from "@/actions/registry/deduplication";
import { requireRegistryPage } from "@/lib/registry-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layers, ArrowRight, ShieldCheck, Clock } from "lucide-react";

export default async function RegistryMergedRecordsPage() {
  await requireRegistryPage();
  const data = await getMergedRecords();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Consolidated Master Records History</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Audit trail and traceability of merged duplicate records in the DATA DEDUPLICATION AND RECORD MATCHING SYSTEM registry.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Merged Record Audit Log</CardTitle>
              <CardDescription className="text-xs">
                Every consolidation operation preserves both original records and links them to the active Master Record.
              </CardDescription>
            </div>
            <Badge variant="outline">{data.total} Merged Pairs</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.items.length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <Layers className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-semibold">No merged duplicate records yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                Run a deduplication pipeline, review confirmed match candidates, and merge duplicate records to populate this log.
              </p>
              <Button asChild size="sm">
                <Link href="/registry/reviews">Review Matching Candidates</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Master Record (Preserved)</TableHead>
                    <TableHead>Source Record (Consolidated)</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Merge Reason</TableHead>
                    <TableHead>Merged At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <p className="font-semibold text-xs truncate">
                            {item.masterRecord.fullName}
                          </p>
                        </div>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                          Reg No: {item.masterRecord.registrationNumber || "None"} · {item.masterRecord.campus}
                        </p>
                      </TableCell>

                      <TableCell className="max-w-[200px]">
                        <p className="font-medium text-xs text-muted-foreground truncate">
                          {item.sourceRecord.fullName}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                          Reg No: {item.sourceRecord.registrationNumber || "None"}
                        </p>
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-xs font-semibold">
                          {(item.matchCandidate.overallScore * 100).toFixed(1)}%
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                        {item.mergeReason || "Duplicate consolidation"}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.mergedAt).toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                          <Link href={`/registry/review/${item.matchCandidate.id}`}>
                            View Pair <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
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
