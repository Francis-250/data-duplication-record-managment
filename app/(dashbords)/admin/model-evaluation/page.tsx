import { getModelEvaluationMetricsData } from "@/actions/admin/operations";
import { requireAdminPage } from "@/lib/admin-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, CheckCircle2, AlertCircle, BarChart3, Info } from "lucide-react";

export default async function ModelEvaluationPage() {
  await requireAdminPage();
  const data = await getModelEvaluationMetricsData();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Machine Learning & Record Linkage Model Evaluation</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Benchmarking of multi-attribute similarity classifiers, Fellegi-Sunter log-likelihood linkage, and supervised ML models for University of Kigali student deduplication.
        </p>
      </div>

      {/* Primary ML Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-emerald-500/30">
          <CardHeader className="pb-1.5 pt-4 px-4">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Precision</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-emerald-600">{data.precision}%</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">TP / (TP + FP)</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30">
          <CardHeader className="pb-1.5 pt-4 px-4">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Recall (Sensitivity)</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-blue-600">{data.recall}%</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">TP / (TP + FN)</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader className="pb-1.5 pt-4 px-4">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">F1-Score (Harmonic Mean)</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-primary">{data.f1Score}%</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">2 * (P * R) / (P + R)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1.5 pt-4 px-4">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Overall Accuracy</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono">{data.accuracy}%</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">(TP + TN) / Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Note on Class Imbalance */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-foreground flex items-start gap-3">
        <Info className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Class Imbalance Notice</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            In record linkage and deduplication, true duplicates represent a tiny fraction (&lt; 2%) of all possible pairwise combinations. Because high accuracy can be trivially achieved by predicting non-match on everything, the system prioritizes <strong>F1-Score, Precision, and Recall</strong> over raw Accuracy alone.
          </p>
        </div>
      </div>

      {/* Confusion Matrix Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Classification Confusion Matrix</CardTitle>
          <CardDescription className="text-xs">
            Evaluated on confirmed duplicate pairs vs non-duplicate pairs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-lg mx-auto py-2">
            <div className="border p-4 rounded-xl text-center bg-emerald-500/10 border-emerald-500/30">
              <span className="text-xs font-semibold uppercase text-emerald-950 dark:text-emerald-200 block">
                True Positives (TP)
              </span>
              <span className="text-3xl font-bold font-mono text-emerald-600 mt-1 block">
                {data.tp}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 block">Actual Match → Predicted Match</span>
            </div>

            <div className="border p-4 rounded-xl text-center bg-destructive/10 border-destructive/30">
              <span className="text-xs font-semibold uppercase text-destructive block">
                False Positives (FP)
              </span>
              <span className="text-3xl font-bold font-mono text-destructive mt-1 block">
                {data.fp}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 block">Actual Non-Match → Predicted Match</span>
            </div>

            <div className="border p-4 rounded-xl text-center bg-amber-500/10 border-amber-500/30">
              <span className="text-xs font-semibold uppercase text-amber-950 dark:text-amber-200 block">
                False Negatives (FN)
              </span>
              <span className="text-3xl font-bold font-mono text-amber-600 mt-1 block">
                {data.fn}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 block">Actual Match → Predicted Non-Match</span>
            </div>

            <div className="border p-4 rounded-xl text-center bg-card">
              <span className="text-xs font-semibold uppercase text-muted-foreground block">
                True Negatives (TN)
              </span>
              <span className="text-3xl font-bold font-mono mt-1 block">
                {data.tn}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 block">Actual Non-Match → Predicted Non-Match</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Benchmark Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Algorithm Benchmark Comparison</CardTitle>
          <CardDescription className="text-xs">
            Performance comparison of record matching models across University of Kigali student datasets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Algorithm Architecture</TableHead>
                  <TableHead>F1-Score</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Latency Profile</TableHead>
                  <TableHead className="text-right">Deployment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.algorithms.map((algo: any) => (
                  <TableRow key={algo.name}>
                    <TableCell className="font-semibold text-xs">{algo.name}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary">{algo.f1Score}%</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{algo.accuracy}%</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{algo.speed}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={algo.status.includes("Active") ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {algo.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
