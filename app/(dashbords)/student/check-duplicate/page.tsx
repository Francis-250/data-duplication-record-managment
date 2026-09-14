"use client";

import { useState, useTransition } from "react";
import { checkStudentPotentialDuplicate } from "@/actions/student/records";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, ShieldCheck, Search } from "lucide-react";

export default function StudentDuplicateCheckPage() {
  const [regNo, setRegNo] = useState("");
  const [nid, setNid] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasWarning, setHasWarning] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNo.trim() && !nid.trim() && !lastName.trim()) {
      toast.error("Please provide at least a Registration Number, National ID, or Last Name.");
      return;
    }

    startTransition(async () => {
      const res = await checkStudentPotentialDuplicate({
        registrationNumber: regNo,
        nationalId: nid,
        firstName,
        lastName,
      });

      setResults(res.potentialDuplicates);
      setHasWarning(res.hasHighRiskDuplicate);
      setChecked(true);

      if (res.hasHighRiskDuplicate) {
        toast.warning(`Found ${res.potentialDuplicates.length} matching record(s).`);
      } else {
        toast.success("No duplicate record found. You have a clean registration status.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Duplicate Record Pre-Check</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Verify if an admission profile, registration number, or national identity is already registered in the University of Kigali database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Verify Student Identifiers</CardTitle>
          <CardDescription className="text-xs">
            Enter one or more identifiers to search for existing duplicates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="regNo" className="text-xs">Registration Number</Label>
                <Input
                  id="regNo"
                  placeholder="e.g. UOK/2024/BIT/042"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nid" className="text-xs">National ID (or Passport)</Label>
                <Input
                  id="nid"
                  placeholder="16-digit Rwandan ID or Passport"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="e.g. Jean"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Habimana"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              {pending ? "Checking Database..." : "Verify Duplicate Status"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {checked && (
        <div>
          {hasWarning ? (
            <Card className="border-amber-500/40">
              <CardHeader className="bg-amber-500/10 rounded-t-lg pb-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base font-semibold">
                    Potential Duplicate Records Found ({results.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-amber-950/80 dark:text-amber-300">
                  The following existing records match one or more of your entered identifiers. If you submit a new record, Registry Staff will compare both records and determine whether to merge them.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Registration No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Programme</TableHead>
                        <TableHead>Campus</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs font-semibold">
                            {r.registrationNumber || "--"}
                          </TableCell>
                          <TableCell className="font-medium text-sm">{r.fullName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.programme || "--"}</TableCell>
                          <TableCell className="text-xs">{r.campus || "Kigali Campus"}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>
                              {r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-500/40">
              <CardContent className="pt-6 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
                <h3 className="text-base font-semibold text-emerald-950 dark:text-emerald-200">
                  Clean Registration Status - No Duplicates Found
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                  No existing student records in the University of Kigali registry match these identifiers. You may safely register or submit your official record.
                </p>
                <Button asChild size="sm">
                  <a href="/student/submit">Proceed to Record Submission</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
