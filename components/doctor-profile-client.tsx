"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Edit2, Lock, Save, X } from "lucide-react";
import {
  revokeDoctorSession,
  updateDoctorAccount,
  updateDoctorProfessional,
} from "@/actions/doctor/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

type Props = {
  user: {
    name: string;
    email: string;
    phoneNumber: string | null;
    displayUsername: string | null;
    twoFactorEnabled: boolean;
  };
  profile: {
    specialization: string | null;
    hospitalName: string | null;
    licenseNumber: string | null;
    isVerified: boolean;
  };
  sessions: {
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    updatedAt: string;
    current: boolean;
  }[];
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function device(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  const browser = userAgent.includes("Firefox") ? "Firefox" : userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Safari") ? "Safari" : "Browser";
  const os = userAgent.includes("Windows") ? "Windows" : userAgent.includes("Mac") ? "macOS" : userAgent.includes("Android") ? "Android" : "device";
  return `${browser} on ${os}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{children}</p>;
}

export function DoctorProfileClient({ user, profile, sessions }: Props) {
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(false);
  const [account, setAccount] = useState({
    name: user.name,
    phoneNumber: user.phoneNumber ?? "",
    displayUsername: user.displayUsername ?? "",
  });
  const [professional, setProfessional] = useState({
    specialization: profile.specialization ?? "",
    hospitalName: profile.hospitalName ?? "",
    licenseNumber: profile.licenseNumber ?? "",
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-1">Settings</p>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      </div>
      {message && <p className="mb-4 rounded-lg border px-4 py-3 text-sm text-muted-foreground">{message}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:sticky lg:top-6 rounded-lg border p-5 text-center">
          <div className="mx-auto mb-3 size-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold">
            {initials(user.name)}
          </div>
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{profile.specialization ?? "Doctor"}</p>
          <p className="text-xs text-muted-foreground">{profile.hospitalName ?? "Hospital not set"}</p>
          <Badge variant={profile.isVerified ? "secondary" : "outline"} className="mt-3">
            <CheckCircle2 size={11} />
            {profile.isVerified ? "Verified" : "Pending"}
          </Badge>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border p-5">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle>Professional information</SectionTitle>
              {!editingProfessional ? (
                <Button variant="ghost" size="sm" onClick={() => setEditingProfessional(true)}><Edit2 size={12} /> Edit</Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" disabled={pending} onClick={() => run(() => updateDoctorProfessional(professional), () => setEditingProfessional(false))}><Save size={12} /> Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingProfessional(false)}><X size={12} /></Button>
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs">Specialization</Label><Input disabled={!editingProfessional} value={professional.specialization} onChange={(e) => setProfessional({ ...professional, specialization: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Hospital</Label><Input disabled={!editingProfessional} value={professional.hospitalName} onChange={(e) => setProfessional({ ...professional, hospitalName: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">License number</Label><Input disabled={!editingProfessional || !!profile.licenseNumber} value={professional.licenseNumber} onChange={(e) => setProfessional({ ...professional, licenseNumber: e.target.value })} /><p className="text-[11px] text-muted-foreground">License number cannot be changed after it is set.</p></div>
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle>Account information</SectionTitle>
              {!editingAccount ? (
                <Button variant="ghost" size="sm" onClick={() => setEditingAccount(true)}><Edit2 size={12} /> Edit</Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" disabled={pending} onClick={() => run(() => updateDoctorAccount(account), () => setEditingAccount(false))}><Save size={12} /> Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingAccount(false)}><X size={12} /></Button>
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs">Full name</Label><Input disabled={!editingAccount} value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Display username</Label><Input disabled={!editingAccount} value={account.displayUsername} onChange={(e) => setAccount({ ...account, displayUsername: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input disabled value={user.email} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Phone number</Label><Input disabled={!editingAccount} value={account.phoneNumber} onChange={(e) => setAccount({ ...account, phoneNumber: e.target.value })} /></div>
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <SectionTitle>Security</SectionTitle>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div><p className="text-sm font-medium">Two-factor authentication</p><p className="text-xs text-muted-foreground">Managed through your secure authentication flow</p></div>
              <Switch checked={user.twoFactorEnabled} disabled aria-label="Two-factor authentication status" />
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-sm font-medium">Password</p><p className="text-xs text-muted-foreground">Change your account password</p></div>
              <Button asChild variant="outline" size="sm"><Link href="/auth/forgot-password"><Lock size={12} /> Change</Link></Button>
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <SectionTitle>Active sessions</SectionTitle>
            <div className="mt-4 space-y-4">
              {sessions.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="size-8 shrink-0 rounded-full bg-muted flex items-center justify-center"><Clock size={13} /></div>
                    <div className="min-w-0"><p className="text-sm font-medium truncate">{device(item.userAgent)} {item.current && <Badge variant="secondary" className="ml-1 text-[10px]">Current</Badge>}</p><p className="text-xs text-muted-foreground">{item.ipAddress ?? "Unknown IP"} · {item.updatedAt}</p></div>
                  </div>
                  {!item.current && <Button variant="ghost" size="sm" disabled={pending} className="text-destructive" onClick={() => run(() => revokeDoctorSession(item.id))}>Revoke</Button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
