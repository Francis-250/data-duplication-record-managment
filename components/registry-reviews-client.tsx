"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reviewMatchCandidate } from "@/actions/registry/deduplication";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Eye, Check, X, ArrowRight, Layers } from "lucide-react";

export function RegistryReviewsClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [candidates, setCandidates] = useState(initialData.items);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pending, startTransition] = useTransition();

  const handleQuickAction = (id: string, decision: "CONFIRMED" | "REJECTED") => {
    startTransition(async () => {
      try {
        await reviewMatchCandidate(id, decision, `Quick ${decision.toLowerCase()} from review table.`);
        toast.success(`Candidate pair marked as ${decision}.`);
        setCandidates((prev: any[]) =>
          prev.map((c) => (c.id === id ? { ...c, reviewStatus: decision } : c))
        );
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Failed to update review status.");
      }
    });
  };

  const filtered = candidates.filter((c: any) => {
    const matchesQuery =
      !query.trim() ||
      `${c.recordA.fullName} ${c.recordB.fullName} ${c.recordA.registrationNumber} ${c.recordB.registrationNumber} ${c.explanation}`
        .toLowerCase()
        .includes(query.toLowerCase());

    const matchesClass = classFilter === "ALL" || c.classification === classFilter;
    const matchesStatus = statusFilter === "ALL" || c.reviewStatus === statusFilter;

    return matchesQuery && matchesClass && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidate names, reg numbers..."
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
              <SelectValue placeholder="All Classifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classifications</SelectItem>
              <SelectItem value="MATCH">MATCH Only</SelectItem>
              <SelectItem value="POSSIBLE_MATCH">POSSIBLE_MATCH Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
              <SelectValue placeholder="All Review Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Review Status</SelectItem>
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed Match</SelectItem>
              <SelectItem value="REJECTED">Rejected Match</SelectItem>
              <SelectItem value="MERGED">Merged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Candidate Pairs Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record A (Candidate 1)</TableHead>
                <TableHead>Record B (Candidate 2)</TableHead>
                <TableHead>Overall Score</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Review Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[200px]">
                    <p className="font-semibold text-xs leading-none">{item.recordA.fullName}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      {item.recordA.registrationNumber || "No Reg No"} · {item.recordA.campus}
                    </p>
                  </TableCell>

                  <TableCell className="max-w-[200px]">
                    <p className="font-semibold text-xs leading-none">{item.recordB.fullName}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      {item.recordB.registrationNumber || "No Reg No"} · {item.recordB.campus}
                    </p>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold">
                        {(item.overallScore * 100).toFixed(1)}%
                      </span>
                      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${
                            item.overallScore >= 0.8 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${item.overallScore * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {(item.confidenceScore * 100).toFixed(0)}%
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={item.classification === "MATCH" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {item.classification}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        item.reviewStatus === "CONFIRMED"
                          ? "default"
                          : item.reviewStatus === "MERGED"
                          ? "outline"
                          : item.reviewStatus === "REJECTED"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {item.reviewStatus}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.reviewStatus === "PENDING" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            disabled={pending}
                            onClick={() => handleQuickAction(item.id, "CONFIRMED")}
                            title="Confirm Match"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            disabled={pending}
                            onClick={() => handleQuickAction(item.id, "REJECTED")}
                            title="Reject Match"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}

                      {item.reviewStatus === "CONFIRMED" && (
                        <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                          <Link href={`/registry/merge/${item.id}`}>
                            <Layers className="h-3 w-3 mr-1" /> Merge
                          </Link>
                        </Button>
                      )}

                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link href={`/registry/review/${item.id}`}>
                          Review <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                    No matching candidate pairs found. Run a deduplication pipeline to generate matching candidates.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
