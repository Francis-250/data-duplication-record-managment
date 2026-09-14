import { getModelEvaluationMetricsData, getAiAdminEvaluationInsights } from "@/actions/admin/operations";
import { requireAdminPage } from "@/lib/admin-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot, Info } from "lucide-react";

export default async function ModelEvaluationPage() {
  await requireAdminPage();
  const [data, aiInsights] = await Promise.all([
    getModelEvaluationMetricsData(),
    getAiAdminEvaluationInsights(),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Machine Learning & Record Linkage Model Evaluation</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Benchmarking of multi-attribute similarity classifiers, Fellegi-Sunter log-likelihood linkage, and supervised ML models for the DATA DEDUPLICATION AND RECORD MATCHING SYSTEM.
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

      {/* AI Strategic Model Audit (Powered by GROQ_MODEL openai/gpt-oss-120b) */}
      <Card className="border-indigo-500/40 bg-gradient-to-r from-indigo-950/10 via-background to-blue-950/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-base font-semibold">AI Strategic Model Audit & Calibration</CardTitle>
              <Badge variant="outline" className="text-[10px] border-indigo-500/50 text-indigo-600 dark:text-indigo-400 font-mono">
                {aiInsights.modelUsed}
              </Badge>
            </div>
            <Badge className="bg-indigo-600 text-white text-[10px] self-start sm:self-auto">
              Live AI Audit
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Automated reasoning analysis of model precision, recall trade-offs, and threshold calibration for Rwandan student records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-lg border bg-card/60 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase block">Pipeline Health Assessment</span>
            <p className="text-xs leading-relaxed text-foreground/90">{aiInsights.auditSummary}</p>
          </div>

          <div className="p-3.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 space-y-1">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase block">Threshold Calibration Advice</span>
            <p className="text-xs leading-relaxed text-foreground/90">{aiInsights.thresholdCalibration}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-3 rounded-lg border bg-card/40">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">High-Risk Ambiguity Patterns:</span>
              <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                {aiInsights.highRiskPatterns.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border bg-card/40">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Recommended Executive Actions:</span>
              <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                {aiInsights.recommendedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Benchmark Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Algorithm Benchmark Comparison</CardTitle>
          <CardDescription className="text-xs">
            Performance comparison of record matching models across DATA DEDUPLICATION AND RECORD MATCHING SYSTEM datasets.
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
