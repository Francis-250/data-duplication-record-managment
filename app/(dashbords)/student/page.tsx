import Link from "next/link";
import { getMyStudentRecords } from "@/actions/student/records";
import { requireStudentPage } from "@/lib/student-auth";
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
import { FileText, PlusCircle, Search, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default async function StudentDashboard() {
  const session = await requireStudentPage();
  const records = await getMyStudentRecords();

  const total = records.length;
  const activeCount = records.filter((r) => r.status === "ACTIVE").length;
  const mergedCount = records.filter((r) => r.status === "MERGED").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Record Portal</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome, {session.user.name}. Manage your University of Kigali institutional records and verify duplicate status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button asChild variant="outline" size="sm">
            <Link href="/student/check-duplicate">
              <CheckCircle2 className="mr-2 h-4 w-4 text-primary" /> Duplicate Pre-Check
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/student/submit">
              <PlusCircle className="mr-2 h-4 w-4" /> Submit Record
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted under your student account</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active registry entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Merged Duplicate Records</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{mergedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Consolidated by Registry Staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Your Institutional Records</CardTitle>
              <CardDescription>
                Official academic records registered in the University of Kigali deduplication system.
              </CardDescription>
            </div>
            <Badge variant="outline">{records.length} records</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
              <h3 className="text-sm font-semibold">No records registered yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                Submit your official student admission or enrollment record to ensure your profile is up to date in the registry.
              </p>
              <Button asChild size="sm">
                <Link href="/student/submit">
                  <PlusCircle className="mr-2 h-4 w-4" /> Submit Your First Record
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration No</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>National ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {r.registrationNumber || "Pending"}
                      </TableCell>
                      <TableCell className="font-medium">{r.fullName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.programme || "--"}</TableCell>
                      <TableCell className="text-xs">{r.campus || "Kigali Campus"}</TableCell>
                      <TableCell className="text-xs font-mono">{r.academicYear || "--"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.nationalId ? `${r.nationalId.slice(0, 4)}...${r.nationalId.slice(-4)}` : "--"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "ACTIVE"
                              ? "default"
                              : r.status === "MERGED"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[11px]"
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
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
