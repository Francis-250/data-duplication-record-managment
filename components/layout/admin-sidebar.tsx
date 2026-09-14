"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Brain,
  ClipboardList,
  FileClock,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { label: "Assessments", href: "/admin/assessments", icon: ClipboardList },
  { label: "Doctor feedback", href: "/admin/feedback", icon: MessageSquare },
  { label: "Audit logs", href: "/admin/audit", icon: FileClock },
  { label: "AI operations", href: "/admin/ai", icon: Brain },
  { label: "Profile", href: "/admin/settings", icon: Settings },
];

function Content({ name, mobile = false }: { name: string; mobile?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const signOut = async () => {
    await authClient.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="h-20 border-b px-4 flex flex-col justify-center">
        <Link href="/admin" className="text-sm font-semibold tracking-tight">
          StrokeCheck
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">Admin Console</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ label, href, icon: Icon }) => {
          const active = href === "/admin" ? path === href : path.startsWith(href);
          const link = (
            <Link
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
          return mobile ? <SheetClose asChild key={href}>{link}</SheetClose> : <div key={href}>{link}</div>;
        })}
      </nav>
      <div className="border-t p-3">
        <div className="mb-3 flex items-center gap-2 px-2">
          <div className="size-7 rounded-full bg-muted flex items-center justify-center">
            <Activity size={13} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
          <LogOut size={14} className="mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}

export function AdminSidebar({ name }: { name: string }) {
  return (
    <>
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-56 border-r bg-background">
        <Content name={name} />
      </aside>
      <header className="lg:hidden sticky top-0 z-40 h-14 border-b bg-background flex items-center px-4">
        <Sheet>
          <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu size={18} /><span className="sr-only">Open navigation</span></Button></SheetTrigger>
          <SheetContent side="left" className="w-56 p-0 gap-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <Content name={name} mobile />
          </SheetContent>
        </Sheet>
        <div className="ml-2">
          <p className="text-sm font-semibold tracking-tight">StrokeCheck</p>
          <p className="text-[10px] text-muted-foreground">Admin Console</p>
        </div>
      </header>
    </>
  );
}
