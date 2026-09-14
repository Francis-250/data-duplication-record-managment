"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock,
  Edit2,
  FileClock,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserCog,
  X,
  XCircle,
} from "lucide-react";
import { revokeAdminSession, updateAdminAccount } from "@/actions/admin/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

type AdminUser = {
  name: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
  username: string | null;
  displayUsername: string | null;
  twoFactorEnabled: boolean | null;
  createdAt: string;
};

type SessionItem = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  current: boolean;
};

type AuditItem = {
  id: string;
  action: string;
  description: string | null;
  createdAt: string;
};

type Stats = {
  users: number;
  doctors: number;
  assessments: number;
  unresolvedFeedback: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sessionDevice(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  const browser = userAgent.includes("Firefox")
    ? "Firefox"
    : userAgent.includes("Edg")
      ? "Edge"
      : userAgent.includes("Chrome")
        ? "Chrome"
        : userAgent.includes("Safari")
          ? "Safari"
          : "Browser";
  const os = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Mac")
      ? "macOS"
      : userAgent.includes("Android")
        ? "Android"
        : userAgent.includes("iPhone") || userAgent.includes("iPad")
          ? "iOS"
          : "device";

  return `${browser} on ${os}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function Verification({ label, ok, icon: Icon }: { label: string; ok: boolean; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon size={13} /> {label}
      </span>
      {ok ? (
        <span className="flex items-center gap-1 text-[11px] text-emerald-600">
          <CheckCircle2 size={11} /> Verified
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <XCircle size={11} /> Not verified
        </span>
      )}
    </div>
  );
}

export function AdminProfileClient({
  user,
  sessions,
  auditLogs,
  stats,
}: {
  user: AdminUser;
  sessions: SessionItem[];
  auditLogs: AuditItem[];
  stats: Stats;
}) {
  const [editingAccount, setEditingAccount] = useState(false);
  const [account, setAccount] = useState({
    name: user.name,
    phoneNumber: user.phoneNumber ?? "",
    displayUsername: user.displayUsername ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<void>, done?: () => void) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        done?.();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to save changes.");
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-1">Administrator account</p>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage your admin identity, security status, active sessions, and recent console activity.
        </p>
      </div>

      {message && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-xl border p-5 text-center">
            <div className="mx-auto mb-3 size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
              {initials(user.name)}
            </div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user.displayUsername || user.username ? `@${user.displayUsername || user.username}` : user.email}
            </p>
            <Badge variant="secondary" className="mt-3">
              <ShieldCheck size={11} /> Administrator
            </Badge>
            <p className="mt-3 text-xs text-muted-foreground">Member since {user.createdAt}</p>
          </div>

          <div className="rounded-xl border p-4">
            <SectionTitle>Verification</SectionTitle>
            <div className="mt-4 space-y-2">
              <Verification label="Email" ok={user.emailVerified} icon={Mail} />
              <Verification label="Phone" ok={user.phoneNumberVerified ?? false} icon={Phone} />
              <Verification label="Two-factor" ok={user.twoFactorEnabled ?? false} icon={KeyRound} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <SectionTitle>Console scope</SectionTitle>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                ["Users", stats.users],
                ["Doctors", stats.doctors],
                ["Assessments", stats.assessments],
                ["Feedback", stats.unresolvedFeedback],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-lg font-semibold">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-2 space-y-4">
          <section className="rounded-xl border p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <SectionTitle>Account information</SectionTitle>
                <p className="mt-1 text-xs text-muted-foreground">Your admin display details across the console.</p>
              </div>
              {!editingAccount ? (
                <Button variant="ghost" size="sm" onClick={() => setEditingAccount(true)}>
                  <Edit2 size={12} /> Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" disabled={pending} onClick={() => run(() => updateAdminAccount(account), () => setEditingAccount(false))}>
                    <Save size={12} /> Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAccount({
                        name: user.name,
                        phoneNumber: user.phoneNumber ?? "",
                        displayUsername: user.displayUsername ?? "",
                      });
                      setEditingAccount(false);
                    }}
                  >
                    <X size={12} />
                  </Button>
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full name</Label>
                <Input disabled={!editingAccount} value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Display username</Label>
                <Input disabled={!editingAccount} value={account.displayUsername} onChange={(event) => setAccount({ ...account, displayUsername: event.target.value })} placeholder="admin-display-name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input disabled value={user.email} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone number</Label>
                <Input disabled={!editingAccount} value={account.phoneNumber} onChange={(event) => setAccount({ ...account, phoneNumber: event.target.value })} placeholder="+250..." />
              </div>
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <SectionTitle>Role and permissions</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["User management", "Change roles, suspend accounts, and manage access."],
                ["Doctor approvals", "Review doctor details, approve, reject, or revoke access."],
                ["Clinical oversight", "Assign doctors and monitor assessment review status."],
                ["AI controls", "Limit AI usage globally or for individual patients."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <UserCog size={15} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <SectionTitle>Security</SectionTitle>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">
                  {user.twoFactorEnabled ? "Extra protection is enabled for this account." : "Use two-factor authentication for sensitive admin access."}
                </p>
              </div>
              <Switch checked={user.twoFactorEnabled ?? false} disabled aria-label="Two-factor authentication status" />
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">Send yourself a secure password reset link.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/forgot-password">
                  <Lock size={12} /> Change
                </Link>
              </Button>
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <div className="flex items-center justify-between gap-4">
              <SectionTitle>Active sessions</SectionTitle>
              <Badge variant="outline">{sessions.length}</Badge>
            </div>
            <div className="mt-4 divide-y">
              {sessions.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="size-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                      <Clock size={13} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {sessionDevice(item.userAgent)}
                        {item.current && <Badge variant="secondary" className="ml-2 text-[10px]">Current</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.ipAddress ?? "Unknown IP"} · Updated {item.updatedAt}</p>
                    </div>
                  </div>
                  {!item.current && (
                    <Button variant="ghost" size="sm" disabled={pending} className="text-destructive" onClick={() => run(() => revokeAdminSession(item.id))}>
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <SectionTitle>Recent admin activity</SectionTitle>
                <p className="mt-1 text-xs text-muted-foreground">Latest audit entries written by your account.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/audit">
                  <FileClock size={12} /> View all
                </Link>
              </Button>
            </div>
            <div className="mt-4 divide-y">
              {auditLogs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No recent admin activity.</p>
              ) : (
                auditLogs.map((item) => (
                  <div key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="mt-0.5 size-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                      <Activity size={13} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.action.replaceAll("_", " ").toLowerCase()}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description ?? "No description."}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{item.createdAt}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
