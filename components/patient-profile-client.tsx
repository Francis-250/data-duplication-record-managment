"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit2,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import {
  revokePatientSession,
  updatePatientAccount,
  updatePatientMedicalProfile,
} from "@/actions/patient/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type AccountState = {
  name: string;
  displayUsername: string;
  phoneNumber: string;
};

type MedicalState = {
  age: number | null;
  gender: string | null;
  bloodType: string | null;
  allergies: string | null;
  existingConditions: string | null;
  smokingStatus: boolean;
  diabetic: boolean;
  hypertension: boolean;
  heartDisease: boolean;
};

type ProfileUser = {
  name: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
  username: string | null;
  displayUsername: string | null;
  twoFactorEnabled: boolean | null;
  createdAt: string;
  role: string | null;
  banned: boolean | null;
};

type SessionItem = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  current: boolean;
};

function VerifiedBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex items-center gap-1 text-[11px] text-green-600">
      <CheckCircle size={11} /> Verified
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <XCircle size={11} /> Not verified
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b last:border-0">
      <p className="text-xs text-muted-foreground w-36 flex-shrink-0">
        {label}
      </p>
      <p className="text-sm text-right">
        {value || <span className="text-muted-foreground/50">-</span>}
      </p>
    </div>
  );
}

function RiskFlag({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-md border text-sm",
        active ? "border-amber-200 bg-amber-50" : "border-border bg-background",
      )}
    >
      <span className={active ? "text-amber-800" : "text-muted-foreground"}>
        {label}
      </span>
      {active ? (
        <AlertTriangle size={13} className="text-amber-500" />
      ) : (
        <CheckCircle size={13} className="text-muted-foreground/30" />
      )}
    </div>
  );
}

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

export function PatientProfileClient({
  user,
  patient,
  sessions,
}: {
  user: ProfileUser;
  patient: MedicalState;
  sessions: SessionItem[];
}) {
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingMedical, setEditingMedical] = useState(false);
  const [account, setAccount] = useState<AccountState>({
    name: user.name,
    displayUsername: user.displayUsername ?? "",
    phoneNumber: user.phoneNumber ?? "",
  });
  const [medical, setMedical] = useState<MedicalState>(patient);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveAccount = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        await updatePatientAccount(account);
        setEditingAccount(false);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to save.");
      }
    });
  };

  const saveMedical = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        await updatePatientMedicalProfile(medical);
        setEditingMedical(false);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to save.");
      }
    });
  };

  const revokeSession = (sessionId: string) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await revokePatientSession(sessionId);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Unable to revoke session.",
        );
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-1">Settings</p>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      </div>

      {message && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-4 lg:sticky lg:top-[3.5rem]">
          <div className="rounded-lg border p-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold mb-3">
              {initials(user.name)}
            </div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user.username ? `@${user.username}` : user.email}
            </p>
            <Badge variant="secondary" className="mt-2 text-[11px]">
              {user.role ?? "PATIENT"}
            </Badge>
            {user.banned && (
              <Badge variant="destructive" className="mt-1 text-[11px]">
                Banned
              </Badge>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-0">
            <SectionTitle>Account</SectionTitle>
            <InfoRow label="Member since" value={user.createdAt} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phoneNumber} />
            <InfoRow
              label="Username"
              value={user.username ? `@${user.username}` : null}
            />
          </div>

          <div className="rounded-lg border p-4">
            <SectionTitle>Verification</SectionTitle>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail size={13} /> Email
                </div>
                <VerifiedBadge ok={user.emailVerified} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone size={13} /> Phone
                </div>
                <VerifiedBadge ok={user.phoneNumberVerified ?? false} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield size={13} /> 2FA
                </div>
                <VerifiedBadge ok={user.twoFactorEnabled ?? false} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Account information</SectionTitle>
              {!editingAccount ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setEditingAccount(true)}
                >
                  <Edit2 size={12} className="mr-1.5" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isPending}
                    onClick={saveAccount}
                  >
                    <Save size={12} className="mr-1.5" /> Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setAccount({
                        name: user.name,
                        displayUsername: user.displayUsername ?? "",
                        phoneNumber: user.phoneNumber ?? "",
                      });
                      setEditingAccount(false);
                    }}
                  >
                    <X size={12} />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full name</Label>
                <Input
                  value={account.name}
                  onChange={(e) =>
                    setAccount({ ...account, name: e.target.value })
                  }
                  disabled={!editingAccount}
                  className="text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Display name</Label>
                <Input
                  value={account.displayUsername}
                  onChange={(e) =>
                    setAccount({ ...account, displayUsername: e.target.value })
                  }
                  disabled={!editingAccount}
                  className="text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={user.email} disabled className="text-sm h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone number</Label>
                <Input
                  value={account.phoneNumber}
                  onChange={(e) =>
                    setAccount({ ...account, phoneNumber: e.target.value })
                  }
                  disabled={!editingAccount}
                  className="text-sm h-9"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Medical profile</SectionTitle>
              {!editingMedical ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setEditingMedical(true)}
                >
                  <Edit2 size={12} className="mr-1.5" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isPending}
                    onClick={saveMedical}
                  >
                    <Save size={12} className="mr-1.5" /> Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setMedical(patient);
                      setEditingMedical(false);
                    }}
                  >
                    <X size={12} />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="space-y-1.5">
                <Label className="text-xs">Age</Label>
                <Input
                  type="number"
                  value={medical.age ?? ""}
                  onChange={(e) =>
                    setMedical({
                      ...medical,
                      age: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  disabled={!editingMedical}
                  className="text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Gender</Label>
                <Select
                  value={medical.gender ?? ""}
                  onValueChange={(v) => setMedical({ ...medical, gender: v })}
                  disabled={!editingMedical}
                >
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Blood type</Label>
                <Select
                  value={medical.bloodType ?? ""}
                  onValueChange={(v) =>
                    setMedical({ ...medical, bloodType: v })
                  }
                  disabled={!editingMedical}
                >
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Allergies</Label>
                <Input
                  value={medical.allergies ?? ""}
                  onChange={(e) =>
                    setMedical({ ...medical, allergies: e.target.value })
                  }
                  disabled={!editingMedical}
                  className="text-sm h-9"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Existing conditions</Label>
                <Input
                  value={medical.existingConditions ?? ""}
                  onChange={(e) =>
                    setMedical({
                      ...medical,
                      existingConditions: e.target.value,
                    })
                  }
                  disabled={!editingMedical}
                  className="text-sm h-9"
                />
              </div>
            </div>

            <Separator className="mb-5" />

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Risk factors
            </p>
            {editingMedical ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "smokingStatus", label: "Smoking" },
                  { key: "diabetic", label: "Diabetic" },
                  { key: "hypertension", label: "Hypertension" },
                  { key: "heartDisease", label: "Heart disease" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-md border px-3 py-2.5"
                  >
                    <Label className="text-sm cursor-pointer">{label}</Label>
                    <Switch
                      checked={medical[key as keyof MedicalState] as boolean}
                      onCheckedChange={(v) =>
                        setMedical({ ...medical, [key]: v })
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <RiskFlag label="Smoking" active={medical.smokingStatus} />
                <RiskFlag label="Diabetic" active={medical.diabetic} />
                <RiskFlag label="Hypertension" active={medical.hypertension} />
                <RiskFlag label="Heart disease" active={medical.heartDisease} />
              </div>
            )}
          </div>

          <div className="rounded-lg border p-5">
            <SectionTitle>Security</SectionTitle>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    Two-factor authentication
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user.twoFactorEnabled
                      ? "2FA is enabled on your account"
                      : "Add an extra layer of security"}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-8">
                  {user.twoFactorEnabled ? "Enabled" : "Enable"}
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Change your account password
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="text-xs h-8">
                  <Link href="/auth/forgot-password">
                    <Lock size={12} className="mr-1.5" /> Change
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <SectionTitle>Active sessions</SectionTitle>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active sessions found.
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Clock size={12} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <span className="truncate">
                            {sessionDevice(item.userAgent)}
                          </span>
                          {item.current && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-4 px-1.5"
                            >
                              Current
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.ipAddress ?? "Unknown IP"} · Last active{" "}
                          {item.updatedAt}
                        </p>
                      </div>
                    </div>
                    {!item.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        className="text-xs h-7 text-destructive hover:text-destructive"
                        onClick={() => revokeSession(item.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-destructive/30 p-5">
            <SectionTitle>Danger zone</SectionTitle>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" size="sm" className="text-xs h-8">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
