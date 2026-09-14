"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setGlobalAiDailyLimit, setUserAiDailyLimit } from "@/actions/admin/ai-limits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserLimit = { id: string; name: string; email: string; limit: number | null };

function parseLimit(value: string) {
  if (value.trim().toLowerCase() === "unlimited") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error("Enter 0 or more, or type unlimited.");
  return parsed;
}

export function AdminAiLimits({
  globalLimit,
  users,
}: {
  globalLimit: number | null;
  users: UserLimit[];
}) {
  const [globalValue, setGlobalValue] = useState(globalLimit === null ? "unlimited" : String(globalLimit));
  const [userValues, setUserValues] = useState<Record<string, string>>(
    Object.fromEntries(users.map((user) => [user.id, user.limit === null ? "" : String(user.limit)])),
  );
  const [pending, startTransition] = useTransition();

  const saveGlobal = () => startTransition(async () => {
    try {
      await setGlobalAiDailyLimit(parseLimit(globalValue));
      toast.success("Global AI limit updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update AI limit.");
    }
  });

  const saveUser = (userId: string) => startTransition(async () => {
    try {
      const raw = userValues[userId]?.trim();
      await setUserAiDailyLimit(userId, raw ? parseLimit(raw) : null);
      toast.success("User AI limit updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update AI limit.");
    }
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-5">
        <Label htmlFor="global-ai-limit">Global daily assessment limit</Label>
        <p className="mt-1 text-xs text-muted-foreground">Applies to every patient without a user override. Use 0 to disable or unlimited for no limit.</p>
        <div className="mt-3 flex max-w-md gap-2">
          <Input id="global-ai-limit" value={globalValue} onChange={(event) => setGlobalValue(event.target.value)} />
          <Button disabled={pending} onClick={saveGlobal}>Save</Button>
        </div>
      </div>
      <div className="rounded-lg border divide-y">
        {users.map((user) => (
          <div key={user.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-4">
            <div className="sm:col-span-7">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Input
              className="sm:col-span-3"
              value={userValues[user.id] ?? ""}
              onChange={(event) => setUserValues((current) => ({ ...current, [user.id]: event.target.value }))}
              placeholder="Use global default"
            />
            <Button className="sm:col-span-2" variant="outline" disabled={pending} onClick={() => saveUser(user.id)}>Set limit</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
