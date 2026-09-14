"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  PlusCircle,
  Search,
  CheckCircle2,
  LogOut,
  Menu,
  School,
  GraduationCap,
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

const studentLinks = [
  { label: "My Records", href: "/student", icon: FileText },
  { label: "Submit Record", href: "/student/submit", icon: PlusCircle },
  { label: "Search Records", href: "/student/search", icon: Search },
  { label: "Duplicate Pre-Check", href: "/student/check-duplicate", icon: CheckCircle2 },
];

function StudentNavContent({ name, mobile = false }: { name: string; mobile?: boolean }) {
  const path = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col bg-card border-r">
      <div className="h-16 border-b px-4 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <School size={16} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-tight uppercase leading-none">University of Kigali</p>
          <p className="text-[10px] text-muted-foreground mt-1">Student Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {studentLinks.map(({ label, href, icon: Icon }) => {
          const active = href === "/student" ? path === href : path.startsWith(href);
          const linkNode = (
            <Link
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );

          return mobile ? (
            <SheetClose asChild key={href}>
              {linkNode}
            </SheetClose>
          ) : (
            <div key={href}>{linkNode}</div>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="mb-3 flex items-center gap-2 px-2">
          <div className="size-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
            <GraduationCap size={13} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{name}</p>
            <p className="text-[10px] text-muted-foreground">Enrolled Student</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut size={14} className="mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}

export function StudentSidebar({ name }: { name: string }) {
  return (
    <>
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-60">
        <StudentNavContent name={name} />
      </aside>

      <header className="lg:hidden sticky top-0 z-40 h-14 border-b bg-background flex items-center px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 gap-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Student Navigation</SheetTitle>
            <StudentNavContent name={name} mobile />
          </SheetContent>
        </Sheet>
        <div className="ml-2">
          <p className="text-xs font-bold tracking-tight">University of Kigali</p>
          <p className="text-[10px] text-muted-foreground">Student Portal</p>
        </div>
      </header>
    </>
  );
}
