"use client";

import { useState, useTransition } from "react";
import { searchAllowedRecords } from "@/actions/student/records";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShieldAlert, BookOpen, AlertCircle } from "lucide-react";

export default function StudentSearchRecordsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      const data = await searchAllowedRecords(query);
      setResults(data);
      setSearched(true);
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Institutional Record Directory</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Search University of Kigali verified student records and academic enrollment information.
        </p>
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-950 dark:text-blue-200 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Protected Privacy View</p>
          <p className="mt-1 leading-relaxed">
            In compliance with the University Data Protection Policy, private contact details, national identity numbers, and addresses of other students are protected and withheld from student view.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Search Institutional Registry</CardTitle>
          <CardDescription className="text-xs">
            Search by student name, registration number, or academic programme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by student name, registration number (e.g. UOK/2024/BIT/042), or programme..."
                className="pl-9 h-10 text-sm"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Search Results ({results.length})
              </CardTitle>
              {results.length > 0 && <Badge variant="outline">Verified Registry Entries</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-10 border rounded-lg border-dashed">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No matching student records found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try checking the spelling or searching with a partial registration number.
                </p>
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
                      <TableHead>Registry Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {item.registrationNumber || "Pending"}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{item.fullName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.programme || "--"}
                        </TableCell>
                        <TableCell className="text-xs">{item.campus || "Kigali Campus"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.academicYear || "--"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.status === "ACTIVE" ? "default" : "secondary"}
                            className="text-[11px]"
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
