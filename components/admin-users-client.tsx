"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { setUserBanned, setUserRole } from "@/actions/admin/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  verified: boolean;
  createdAt: string;
};

export function AdminUsersClient({ users }: { users: AdminUserItem[] }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const filtered = users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase()));

  const run = (action: () => Promise<void>) => {
    setMessage(null);
    startTransition(async () => {
      try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : "Action failed."); }
    });
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="border-b p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users..." className="pl-9" />
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} users</p>
      </div>
      {message && <p className="border-b px-4 py-3 text-xs text-destructive">{message}</p>}
      <div className="divide-y">
        {filtered.map((user) => (
          <div key={user.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-4 items-center">
            <div className="md:col-span-4 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="md:col-span-2 flex gap-1.5">
              <Badge variant={user.banned ? "destructive" : "secondary"}>{user.banned ? "Suspended" : "Active"}</Badge>
              {user.verified && <Badge variant="outline">Verified</Badge>}
            </div>
            <p className="md:col-span-2 text-xs text-muted-foreground">{user.createdAt}</p>
            <div className="md:col-span-2">
              <Select value={user.role.toLowerCase()} disabled={pending} onValueChange={(role) => run(() => setUserRole(user.id, role))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="patient">Patient</SelectItem><SelectItem value="doctor">Doctor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 md:text-right">
              <Button variant={user.banned ? "outline" : "destructive"} size="sm" disabled={pending} onClick={() => run(() => setUserBanned(user.id, !user.banned))}>
                {user.banned ? "Restore" : "Suspend"}
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No users found.</p>}
      </div>
    </div>
  );
}
