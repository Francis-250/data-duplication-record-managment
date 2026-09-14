import Link from "next/link";
import {
  School,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Building2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const portals = [
  {
    role: "Student",
    icon: GraduationCap,
    title: "Student Portal",
    description:
      "Submit personal and academic records, run pre-registration duplicate checks, and track verification status.",
    href: "/auth/login",
  },
  {
    role: "Registry Staff",
    icon: Building2,
    title: "Registry Staff Portal",
    description:
      "Upload cohort CSVs, execute multi-attribute similarity matching, and review pairs side-by-side to merge duplicates.",
    href: "/auth/login",
  },
  {
    role: "Administrator",
    icon: ShieldCheck,
    title: "Admin Console",
    description:
      "Calibrate matching algorithms and thresholds, monitor institutional audit trails, and manage user roles.",
    href: "/auth/login",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col justify-between bg-background text-foreground overflow-x-hidden md:overflow-hidden">
      {/* Navigation Header */}
      <header className="h-16 flex-none border-b bg-background/95 backdrop-blur z-50">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <School size={18} />
            </span>
            <div>
              <span className="text-sm font-bold tracking-tight block">University of Kigali</span>
              <span className="text-[10px] text-muted-foreground block -mt-0.5">Record Deduplication System</span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">
                Register <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Single-Page Hero & Portal Access */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <Badge
            variant="outline"
            className="mb-3 rounded-full px-3.5 py-1 text-xs font-medium border-primary/30 bg-primary/5 text-primary"
          >
            <Sparkles size={12} className="mr-1.5" /> Institutional Record Linkage & Deduplication
          </Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Identify and resolve duplicate student records with precision.
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Standardize student data across campus registries, resolve spelling differences, typographical errors, and identifier variations, with secure human-in-the-loop consolidation.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button asChild size="sm" className="shadow-xs px-5">
              <Link href="/auth/login">
                Access Portal <ArrowRight size={14} className="ml-1.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="px-5">
              <Link href="/auth/register">Create Account</Link>
            </Button>
          </div>
        </div>

        {/* 3 Compact Role Portals */}
        <div className="grid gap-3.5 sm:grid-cols-3 w-full">
          {portals.map(({ role, icon: Icon, title, description, href }) => (
            <div
              key={role}
              className="rounded-xl border bg-card p-4.5 shadow-xs flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-xs"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon size={16} />
                  </span>
                  <h2 className="font-semibold text-sm tracking-tight">{title}</h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-3 -ml-2 text-xs self-start text-primary hover:text-primary hover:bg-primary/5"
              >
                <Link href={href}>
                  Enter as {role} <ArrowRight size={12} className="ml-1" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </main>

      {/* Compact Single Row Footer */}
      <footer className="h-12 flex-none border-t bg-muted/20">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <School size={13} className="text-primary" />
            <span className="font-semibold text-foreground">University of Kigali</span>
            <span className="hidden sm:inline">· Student Admissions & Deduplication Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
