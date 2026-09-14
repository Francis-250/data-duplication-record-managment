"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadAndValidateCsv, commitDatasetImport } from "@/actions/registry/import";
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
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

export function RegistryImportClient({ initialImports }: { initialImports: any[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, startValidation] = useTransition();
  const [committing, startCommit] = useTransition();
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please select a standard .csv file.");
        return;
      }
      setSelectedFile(file);
      setAnalysisResult(null);
    }
  };

  const handleValidateUpload = () => {
    if (!selectedFile) {
      toast.error("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    startValidation(async () => {
      try {
        const result = await uploadAndValidateCsv(formData);
        setAnalysisResult(result);
        if (result.errors.length === 0) {
          toast.success(`Validation successful! ${result.validRowsCount} valid rows ready to commit.`);
        } else {
          toast.warning(`Validation identified ${result.errors.length} issue(s) across rows.`);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to validate CSV file.");
      }
    });
  };

  const handleCommit = (importId: string) => {
    startCommit(async () => {
      try {
        const res = await commitDatasetImport(importId);
        toast.success(`Successfully imported ${res.importedCount} student records to University registry!`);
        setSelectedFile(null);
        setAnalysisResult(null);
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Failed to commit records.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload & Validation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">1. Upload Student Cohort CSV</CardTitle>
          <CardDescription className="text-xs">
            Import records exported from admissions, legacy student portals, or faculty registration sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary/60 hover:bg-muted/30"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <FileSpreadsheet className="mx-auto h-12 w-12 text-primary/80 mb-3" />
            <p className="text-sm font-semibold">
              {selectedFile ? selectedFile.name : "Click or drag CSV file here to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports columns: First Name, Last Name, Registration Number, National ID, Email, Phone, Programme, Campus, DOB
            </p>
            {selectedFile && (
              <p className="text-xs text-primary font-mono mt-2">
                {(selectedFile.size / 1024).toFixed(1)} KB · Ready for validation
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {selectedFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setAnalysisResult(null);
                }}
              >
                Clear
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleValidateUpload}
              disabled={!selectedFile || validating}
            >
              <Upload className="mr-2 h-4 w-4" />
              {validating ? "Validating CSV Schema..." : "Validate & Check Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Result Preview */}
      {analysisResult && (
        <Card className="border-primary/40">
          <CardHeader className="bg-primary/5 pb-3 rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  2. Validation Results & In-File Quality Check
                </CardTitle>
                <CardDescription className="text-xs">
                  Review column mapping, required fields, and duplicate rows detected in the uploaded file.
                </CardDescription>
              </div>

              {analysisResult.validRowsCount > 0 && (
                <Button
                  onClick={() => handleCommit(analysisResult.importId)}
                  disabled={committing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {committing ? "Importing to Registry..." : `Commit ${analysisResult.validRowsCount} Valid Records`}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border p-3 rounded-lg text-center bg-card">
                <span className="text-[10px] uppercase text-muted-foreground block">Total Data Rows</span>
                <span className="text-xl font-bold font-mono">{analysisResult.totalRows}</span>
              </div>
              <div className="border p-3 rounded-lg text-center bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                <span className="text-[10px] uppercase block">Valid Records</span>
                <span className="text-xl font-bold font-mono text-emerald-600">
                  {analysisResult.validRowsCount}
                </span>
              </div>
              <div className="border p-3 rounded-lg text-center bg-destructive/10 text-destructive">
                <span className="text-[10px] uppercase block">Invalid Rows</span>
                <span className="text-xl font-bold font-mono">{analysisResult.invalidRowsCount}</span>
              </div>
              <div className="border p-3 rounded-lg text-center bg-amber-500/10 text-amber-900 dark:text-amber-200">
                <span className="text-[10px] uppercase block">In-File Duplicates</span>
                <span className="text-xl font-bold font-mono text-amber-600">
                  {analysisResult.duplicateRowsCount}
                </span>
              </div>
            </div>

            {/* Error Breakdown Table */}
            {analysisResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5 text-destructive">
                  <XCircle className="h-4 w-4" />
                  Detailed Row Validation Errors ({analysisResult.errors.length})
                </p>
                <div className="rounded-md border max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Row #</TableHead>
                        <TableHead className="w-32">Field</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisResult.errors.map((err: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs font-bold text-destructive">
                            {err.row === 0 ? "Header" : `Row ${err.row}`}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{err.field}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {err.value || "(empty)"}
                          </TableCell>
                          <TableCell className="text-xs">{err.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Import History & Audit</CardTitle>
          <CardDescription className="text-xs">
            Log of previously uploaded dataset batches and institutional import history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialImports.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No previous datasets imported</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Total Rows</TableHead>
                    <TableHead>Valid Rows</TableHead>
                    <TableHead>Invalid / Duplicates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Imported Records</TableHead>
                    <TableHead>Date Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialImports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs">
                        {item.originalFileName}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{item.totalRows}</TableCell>
                      <TableCell className="text-xs font-mono text-emerald-600 font-semibold">
                        {item.validRows}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {item.invalidRows} / {item.duplicateRows}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "IMPORTED"
                              ? "default"
                              : item.status === "VALID"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold">
                        {item._count?.records ?? 0}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
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
