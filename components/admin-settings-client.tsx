"use client";

import { useState, useTransition } from "react";
import { updateDeduplicationSetting } from "@/actions/admin/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Save, ShieldCheck, Cpu } from "lucide-react";

export function AdminSettingsClient({ initialSettings }: { initialSettings: Record<string, any> }) {
  const [settings, setSettings] = useState(initialSettings);
  const [pending, startTransition] = useTransition();

  const handleSave = (key: string, value: string, description: string) => {
    startTransition(async () => {
      try {
        await updateDeduplicationSetting(key, value, description);
        setSettings((prev) => ({
          ...prev,
          [key]: { ...prev[key], value },
        }));
        toast.success(`Setting '${key}' updated successfully.`);
      } catch (err: any) {
        toast.error(err?.message || "Failed to save setting.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Matching Parameters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Algorithm & Classification Thresholds</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Global defaults utilized by the DATA DEDUPLICATION AND RECORD MATCHING SYSTEM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mThresh" className="text-xs font-semibold">Definite Match Threshold (0.50 - 1.00)</Label>
              <div className="flex gap-2">
                <Input
                  id="mThresh"
                  defaultValue={settings.match_threshold?.value || "0.80"}
                  className="text-xs font-mono"
                  onBlur={(e) =>
                    handleSave(
                      "match_threshold",
                      e.target.value,
                      "Pairs at or above this score are classified as MATCH"
                    )
                  }
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Pairs scoring at or above this are classified as MATCH</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pThresh" className="text-xs font-semibold">Possible Match Threshold (0.30 - 0.90)</Label>
              <div className="flex gap-2">
                <Input
                  id="pThresh"
                  defaultValue={settings.possible_threshold?.value || "0.52"}
                  className="text-xs font-mono"
                  onBlur={(e) =>
                    handleSave(
                      "possible_threshold",
                      e.target.value,
                      "Pairs between this and match score are classified as POSSIBLE_MATCH"
                    )
                  }
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Pairs scoring between this and match score are classified as POSSIBLE_MATCH</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="defAlgo" className="text-xs font-semibold">Default Classification Algorithm</Label>
              <Select
                defaultValue={settings.default_algorithm?.value || "Hybrid Fellegi-Sunter & Token Similarity"}
                onValueChange={(val) =>
                  handleSave("default_algorithm", val, "Default algorithm for automated deduplication runs")
                }
              >
                <SelectTrigger id="defAlgo" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hybrid Fellegi-Sunter & Token Similarity">
                    Hybrid Fellegi-Sunter & Token Similarity (Recommended)
                  </SelectItem>
                  <SelectItem value="Random Forest Matcher">
                    Random Forest Multi-Attribute Matcher
                  </SelectItem>
                  <SelectItem value="Logistic Regression Scoring">
                    Logistic Regression Probabilistic Linkage
                  </SelectItem>
                  <SelectItem value="Deterministic Rule-Based">
                    Deterministic Multi-Pass Rule-Based Matcher
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exThresh" className="text-xs font-semibold">Exhaustive Candidate Cap</Label>
              <Input
                id="exThresh"
                defaultValue={settings.exhaustive_threshold?.value || "300"}
                className="text-xs font-mono"
                onBlur={(e) =>
                  handleSave(
                    "exhaustive_threshold",
                    e.target.value,
                    "Dataset record count below which exhaustive pairing is used instead of blocking"
                  )
                }
              />
              <p className="text-[10px] text-muted-foreground">Datasets below this count use exhaustive comparisons</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primaryCampus" className="text-xs font-semibold">Primary Campus Default</Label>
              <Input
                id="primaryCampus"
                defaultValue={settings.primary_campus?.value || "Main Campus"}
                className="text-xs"
                onBlur={(e) =>
                  handleSave(
                    "primary_campus",
                    e.target.value,
                    "Default primary campus for student records"
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institutional Metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Institutional Configuration</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Institutional Registry branding and policy parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="instName" className="text-xs font-semibold">Institution Name</Label>
              <Input
                id="instName"
                defaultValue={settings.institution_name?.value || "DATA DEDUPLICATION AND RECORD MATCHING SYSTEM"}
                className="text-xs"
                onBlur={(e) =>
                  handleSave(
                    "institution_name",
                    e.target.value,
                    "Official name of the academic institution"
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
