"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Eye, Filter, School } from "lucide-react";

export function RegistryRecordsClient({ initialRecords }: { initialRecords: any[] }) {
  const [records] = useState(initialRecords);
  const [query, setQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Filter records
  const filtered = records.filter((r) => {
    const matchesQuery =
      !query.trim() ||
      `${r.fullName} ${r.registrationNumber} ${r.nationalId} ${r.email} ${r.programme}`
        .toLowerCase()
        .includes(query.toLowerCase());

    const matchesCampus = campusFilter === "ALL" || r.campus === campusFilter;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

    return matchesQuery && matchesCampus && matchesStatus;
  });

  const campuses = Array.from(new Set(records.map((r) => r.campus).filter(Boolean)));

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name, reg no, national ID, email..."
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={campusFilter} onValueChange={setCampusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
              <SelectValue placeholder="All Campuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Campuses</SelectItem>
              {campuses.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="MERGED">Merged</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Records Count Badge */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Showing {filtered.length} of {records.length} institutional student records</span>
      </div>

      {/* Records Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration No</TableHead>
                <TableHead>Student Full Name</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>National ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {record.registrationNumber || "--"}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {record.fullName}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {record.programme || "--"}
                  </TableCell>
                  <TableCell className="text-xs">{record.campus || "Kigali Campus"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {record.nationalId || "--"}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{record.phoneNumber || "--"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === "ACTIVE"
                          ? "default"
                          : record.status === "MERGED"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[11px]"
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                    {record.recordSource || record.datasetImport?.originalFileName || "Manual"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedRecord(record)}
                      aria-label="View record details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-sm text-muted-foreground">
                    No matching student records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Record Details Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <School className="h-4 w-4 text-primary" />
              Institutional Student Record Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record ID: {selectedRecord?.id} · Status: {selectedRecord?.status}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="grid grid-cols-2 gap-4 text-xs py-2">
              <div className="border p-3 rounded-lg">
                <span className="text-muted-foreground block text-[10px] uppercase">Full Name</span>
                <span className="font-semibold text-sm">{selectedRecord.fullName}</span>
              </div>
              <div className="border p-3 rounded-lg">
                <span className="text-muted-foreground block text-[10px] uppercase">Registration Number</span>
                <span className="font-semibold font-mono text-sm">{selectedRecord.registrationNumber || "--"}</span>
              </div>
              <div className="border p-3 rounded-lg">
                <span className="text-muted-foreground block text-[10px] uppercase">National ID / Passport</span>
                <span className="font-mono">{selectedRecord.nationalId || selectedRecord.passportNumber || "--"}</span>
              </div>
              <div className="border p-3 rounded-lg">
                <span className="text-muted-foreground block text-[10px] uppercase">Date of Birth</span>
                <span>{selectedRecord.dateOfBirth ? new Date(selectedRecord.dateOfBirth).toLocaleDateString() : "--"}</span>
              </div>
              <div className="border p-3 rounded-lg">
                <span className="text-muted-foreground block text-[10px] uppercase">Programme</span>
                <span>{selectedRecord.programme || "--"}</span>
              </div>
              <div className="border p-3 rounded-lg">
                <span className="text-muted-foreground block text-[10px] uppercase">Faculty & Department</span>
                <span>{selectedRecord.faculty || "--"} · {selectedRecord.department || "--"}</span>
              </div>
              <div className="border p-3 rounded-lg">
                <span className="text-muted-foreground block text-[10px] uppercase">Campus & Academic Year</span>
                <span>{selectedRecord.campus || "--"} ({selectedRecord.academicYear || "--"})</span>
              </div>
              <div className="border p-3 rounded-lg">
                <span className="text-muted-foreground block text-[10px] uppercase">Email & Phone</span>
                <span>{selectedRecord.email || "--"} · {selectedRecord.phoneNumber || "--"}</span>
              </div>
              <div className="border p-3 rounded-lg col-span-2">
                <span className="text-muted-foreground block text-[10px] uppercase">Standardized Internal Keys</span>
                <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-[11px] text-muted-foreground">
                  <div>Name: {selectedRecord.standardizedName || "--"}</div>
                  <div>Phone: {selectedRecord.standardizedPhone || "--"}</div>
                  <div>Email: {selectedRecord.standardizedEmail || "--"}</div>
                  <div>RegNo: {selectedRecord.standardizedRegistrationNumber || "--"}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
