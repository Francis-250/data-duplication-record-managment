"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAdminUserRole, toggleAdminUserBan } from "@/actions/admin/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, ShieldAlert, CheckCircle2, UserCheck, Shield } from "lucide-react";

export function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [pending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, newRole: "ADMIN" | "REGISTRY_STAFF" | "STUDENT") => {
    startTransition(async () => {
      try {
        await updateAdminUserRole(userId, newRole);
        toast.success(`User role successfully changed to ${newRole}.`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Failed to update user role.");
      }
    });
  };

  const handleToggleBan = (userId: string, currentBanned: boolean) => {
    startTransition(async () => {
      try {
        await toggleAdminUserBan(userId, !currentBanned, !currentBanned ? "Suspended by administrator" : undefined);
        toast.success(`User account ${!currentBanned ? "suspended" : "restored"}.`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, banned: !currentBanned } : u))
        );
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Failed to toggle account suspension.");
      }
    });
  };

  const filtered = users.filter((u) => {
    const matchesQuery =
      !query.trim() ||
      `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase());

    const matchesRole =
      roleFilter === "ALL" || (u.role && u.role.toUpperCase() === roleFilter);

    return matchesQuery && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="REGISTRY_STAFF">Registry Staff</SelectItem>
              <SelectItem value="ADMIN">Administrator</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name & Email</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Registered At</TableHead>
                <TableHead className="text-right">Access Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const normalizedRole = user.role?.toUpperCase() || "STUDENT";

                return (
                  <TableRow key={user.id}>
                    <TableCell className="max-w-[220px]">
                      <p className="font-semibold text-xs leading-none">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">{user.email}</p>
                    </TableCell>

                    <TableCell>
                      {user.emailVerified ? (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Unverified
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={user.banned ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {user.banned ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>

                    <TableCell className="w-48">
                      <Select
                        value={normalizedRole}
                        disabled={pending}
                        onValueChange={(val: "ADMIN" | "REGISTRY_STAFF" | "STUDENT") =>
                          handleRoleChange(user.id, val)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="REGISTRY_STAFF">Registry Staff</SelectItem>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant={user.banned ? "outline" : "destructive"}
                        size="sm"
                        className="h-7 text-xs"
                        disabled={pending}
                        onClick={() => handleToggleBan(user.id, user.banned)}
                      >
                        {user.banned ? "Restore Account" : "Suspend"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                    No users matching criteria found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
