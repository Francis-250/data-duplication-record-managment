"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileClock, Shield } from "lucide-react";

export function AdminAuditClient({ initialLogs }: { initialLogs: any[] }) {
  const [logs] = useState(initialLogs);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filtered = logs.filter((log) => {
    const matchesQuery =
      !query.trim() ||
      `${log.action} ${log.description} ${log.entityType} ${log.actorUserId}`
        .toLowerCase()
        .includes(query.toLowerCase());

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

    return matchesQuery && matchesAction;
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "RECORD_MERGING":
      case "MATCH_CONFIRMATION":
        return "default";
      case "MATCH_REJECTION":
      case "USER_MANAGEMENT":
        return "destructive";
      case "DEDUPLICATION_EXECUTION":
      case "DATASET_IMPORT":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audit descriptions, actors, entities..."
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-60 h-9 text-xs">
            <SelectValue placeholder="All Activities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Activities</SelectItem>
            <SelectItem value="DATASET_IMPORT">Dataset Import</SelectItem>
            <SelectItem value="DATA_VALIDATION">Data Validation</SelectItem>
            <SelectItem value="DEDUPLICATION_EXECUTION">Deduplication Execution</SelectItem>
            <SelectItem value="MATCH_CONFIRMATION">Match Confirmation</SelectItem>
            <SelectItem value="MATCH_REJECTION">Match Rejection</SelectItem>
            <SelectItem value="RECORD_MERGING">Record Merging</SelectItem>
            <SelectItem value="RECORD_SUBMISSION">Record Submission</SelectItem>
            <SelectItem value="PERMISSION_CHANGES">Permission Changes</SelectItem>
            <SelectItem value="USER_MANAGEMENT">User Management</SelectItem>
            <SelectItem value="SYSTEM_SETTING_CHANGES">Setting Changes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Action</TableHead>
                <TableHead>Event Description</TableHead>
                <TableHead className="w-32">Entity</TableHead>
                <TableHead className="w-36">Actor ID</TableHead>
                <TableHead className="w-40 text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)} className="text-[10px]">
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs leading-relaxed max-w-[320px]">
                    {log.description}
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {log.entityType ? `${log.entityType}` : "--"}
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                    {log.actorUserId || "System"}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground text-right font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-sm text-muted-foreground">
                    No matching activity events recorded.
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
