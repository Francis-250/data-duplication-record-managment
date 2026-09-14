"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  Info,
  MessageSquare,
} from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/patient/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotifType =
  | "HIGH_RISK_ALERT"
  | "DOCTOR_ALERT"
  | "DOCTOR_COMMENT"
  | "DOCTOR_ASSIGNED"
  | "ASSESSMENT_RESULT"
  | "SYSTEM";
type NotifStatus = "UNREAD" | "READ";

export interface PatientNotificationItem {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  date: string;
  status: NotifStatus;
  assessmentId?: string | null;
}

const typeConfig: Record<
  NotifType,
  { icon: React.ElementType; iconClass: string; borderClass: string }
> = {
  HIGH_RISK_ALERT: {
    icon: AlertTriangle,
    iconClass: "text-red-500",
    borderClass: "border-red-200",
  },
  DOCTOR_ALERT: {
    icon: AlertTriangle,
    iconClass: "text-red-500",
    borderClass: "border-red-200",
  },
  DOCTOR_COMMENT: {
    icon: MessageSquare,
    iconClass: "text-blue-500",
    borderClass: "border-border",
  },
  DOCTOR_ASSIGNED: {
    icon: CheckCircle,
    iconClass: "text-blue-500",
    borderClass: "border-border",
  },
  ASSESSMENT_RESULT: {
    icon: CheckCircle,
    iconClass: "text-green-600",
    borderClass: "border-border",
  },
  SYSTEM: {
    icon: Info,
    iconClass: "text-muted-foreground",
    borderClass: "border-border",
  },
};

export function PatientNotificationsClient({
  initialNotifications,
}: {
  initialNotifications: PatientNotificationItem[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => n.status === "UNREAD").length;

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n)),
    );
    startTransition(() => {
      void markNotificationRead(id);
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
    startTransition(() => {
      void markAllNotificationsRead();
    });
  };

  const filtered =
    filter === "UNREAD"
      ? notifications.filter((n) => n.status === "UNREAD")
      : notifications;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Notifications</p>
          <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={isPending}
            onClick={markAllRead}
          >
            <Check size={13} className="mr-1.5" /> Mark all read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Filter
            </p>
            <div className="flex flex-col gap-1">
              {(["ALL", "UNREAD"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left",
                    filter === f
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <span>
                    {f === "ALL" ? "All notifications" : "Unread only"}
                  </span>
                  {f === "UNREAD" && unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] h-4 px-1.5"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                  {f === "ALL" && (
                    <span className="text-xs text-muted-foreground">
                      {notifications.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Types
            </p>
            <div className="space-y-2.5">
              {[
                { type: "HIGH_RISK_ALERT", label: "Risk alerts" },
                { type: "DOCTOR_COMMENT", label: "Doctor notes" },
                { type: "DOCTOR_ASSIGNED", label: "Doctor assignments" },
                { type: "ASSESSMENT_RESULT", label: "Results" },
                { type: "SYSTEM", label: "System" },
              ].map(({ type, label }) => {
                const { icon: Icon, iconClass } = typeConfig[type as NotifType];
                return (
                  <div key={type} className="flex items-center gap-2.5">
                    <Icon size={13} className={iconClass} />
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {filtered.length === 0 ? (
            <div className="rounded-lg border flex flex-col items-center justify-center py-16 text-center">
              <Bell size={24} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No notifications
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                You&apos;re all caught up
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden divide-y">
              {filtered.map((n) => {
                const {
                  icon: Icon,
                  iconClass,
                  borderClass,
                } = typeConfig[n.type];
                const unread = n.status === "UNREAD";

                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-4 px-5 py-4 transition-colors",
                      unread ? "bg-muted/30" : "bg-background",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                        unread ? borderClass : "border-border bg-muted/40",
                      )}
                    >
                      <Icon
                        size={14}
                        className={unread ? iconClass : "text-muted-foreground"}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p
                          className={cn(
                            "text-sm",
                            unread
                              ? "font-semibold"
                              : "font-medium text-muted-foreground",
                          )}
                        >
                          {n.title}
                        </p>
                        {unread && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-muted-foreground/60">
                          {n.date}
                        </p>
                        <div className="flex items-center gap-2">
                          {n.assessmentId && (
                            <Link
                              href={`/patient/assessment/${n.assessmentId}`}
                              className="text-[11px] text-primary underline underline-offset-2 font-medium"
                            >
                              View assessment
                            </Link>
                          )}
                          {unread && (
                            <button
                              type="button"
                              onClick={() => markRead(n.id)}
                              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
