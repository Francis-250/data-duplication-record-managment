"use client";

import { useState, useTransition } from "react";
import { setDatasetActive, saveSystemSetting } from "@/actions/admin/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function AdminDatasetsClient({ datasets }: { datasets: { id: string; name: string; fileName: string; records: number; active: boolean; createdAt: string }[] }) {
  const [pending, startTransition] = useTransition();
  return <div className="rounded-lg border divide-y">{datasets.map((item) => <div key={item.id} className="p-4 flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.fileName} · {item.records.toLocaleString()} records · {item.createdAt}</p></div><div className="flex items-center gap-2"><Badge variant={item.active ? "secondary" : "outline"}>{item.active ? "Active" : "Inactive"}</Badge><Switch disabled={pending} checked={item.active} onCheckedChange={(value) => startTransition(() => setDatasetActive(item.id, value))} /></div></div>)}{datasets.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No datasets uploaded.</p>}</div>;
}

export function AdminSettingsClient({ settings }: { settings: { key: string; value: string; description: string }[] }) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submit = () => startTransition(async () => {
    try { await saveSystemSetting({ key, value, description }); setKey(""); setValue(""); setDescription(""); setMessage("Setting saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
  });

  return <div className="grid lg:grid-cols-3 gap-6 items-start"><div className="rounded-lg border p-5 space-y-4"><p className="text-sm font-medium">Add or update setting</p><div className="space-y-1.5"><Label className="text-xs">Key</Label><Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="example.setting" /></div><div className="space-y-1.5"><Label className="text-xs">Value</Label><Input value={value} onChange={(e) => setValue(e.target.value)} /></div><div className="space-y-1.5"><Label className="text-xs">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div><Button disabled={pending || !key.trim()} onClick={submit}>Save setting</Button>{message && <p className="text-xs text-muted-foreground">{message}</p>}</div><div className="lg:col-span-2 rounded-lg border divide-y">{settings.map((item) => <button key={item.key} type="button" className="w-full p-4 text-left hover:bg-muted/30" onClick={() => { setKey(item.key); setValue(item.value); setDescription(item.description); }}><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{item.key}</p><Badge variant="outline">{item.value}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.description || "No description"}</p></button>)}{settings.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No system settings yet.</p>}</div></div>;
}
