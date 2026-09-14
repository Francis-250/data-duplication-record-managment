import Link from "next/link";
import {
  School,
  ArrowRight,
  GitCompare,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Search,
  Sparkles,
  Users,
  Database,
  Building2,
  GraduationCap,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const duplicateVariations = [
  {
    title: "Different Name Spelling & Missing Middle Name",
    exampleA: "Jean-Paul Habimana",
    exampleB: "Jean Paul Habimana",
    matchType: "Jaro-Winkler & Token Sort (98% match)",
  },
  {
    title: "Phone Number & Capitalization Format",
    exampleA: "0788-123-456",
    exampleB: "+250 788 123 456",
    matchType: "Rwanda E.164 Phone Agreement (100% match)",
  },
  {
    title: "Registration Number Format Differences",
    exampleA: "UOK/2023/BIT/042",
    exampleB: "uok-2023-bit-042",
    matchType: "Canonical Identifier Normalization (100% match)",
  },
  {
    title: "Date of Birth Format Discrepancies",
    exampleA: "2001-05-14 (ISO)",
    exampleB: "14/05/2001 (DD/MM/YYYY)",
    matchType: "Date Agreement & Calendar Parsing (100% match)",
  },
];

const workflows = [
  {
    step: "01",
    icon: FileSpreadsheet,
    title: "Standardize & Ingest",
    desc: "Import CSV cohorts or submit student records. Data is cleaned, trimmed, and standardized across Rwandan phones, national IDs, and names.",
  },
  {
    step: "02",
    icon: GitCompare,
    title: "Blocking & Field Similarity",
    desc: "Multi-pass phonetic and identifier blocking avoids quadratic search. Field similarity is scored via Jaro-Winkler, Levenshtein, and Jaccard algorithms.",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "ML Classification",
    desc: "Probabilistic Fellegi-Sunter and ML scoring classify pairs into MATCH, POSSIBLE_MATCH, or NON_MATCH with explainable confidence.",
  },
  {
    step: "04",
    icon: Layers,
    title: "Review & Non-Destructive Merge",
    desc: "Registry Staff review pairs side-by-side. Confirmed duplicates are consolidated into a single master record without deleting original data.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <School size={18} />
            </span>
            <div>
              <span className="text-sm font-bold tracking-tight block">University of Kigali</span>
              <span className="text-[10px] text-muted-foreground block -mt-0.5">Record Deduplication System</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#duplicate-handling" className="hover:text-foreground transition-colors">Duplicate Variations</a>
            <a href="#portals" className="hover:text-foreground transition-colors">Portals & Roles</a>
          </nav>

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

      {/* Hero Section */}
      <main>
        <section className="border-b">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <Badge variant="outline" className="mb-4 rounded-full px-3 py-1 font-normal border-primary/40 bg-primary/5">
                <ShieldCheck size={12} className="mr-1.5 text-primary" /> University Registry Record Linkage
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-5xl leading-tight">
                Identify duplicate student records with high precision.
              </h1>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                The University of Kigali Data Deduplication System resolves discrepancies across campus admissions, spelling variations, inverted names, and differing phone or registration number formats.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/auth/login">
                    Access Portal <ArrowRight size={15} className="ml-1.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#how-it-works">Learn the Matching Pipeline</a>
                </Button>
              </div>
            </div>

            {/* Interactive Preview Card */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Matching Engine Preview</p>
                  <p className="text-sm font-semibold mt-0.5">Candidate Pair Comparison</p>
                </div>
                <Badge variant="default" className="bg-emerald-600">MATCH (96.4%)</Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">Record A (Admissions)</span>
                    <span className="font-semibold block mt-0.5">Jean-Paul Habimana</span>
                    <span className="text-[10px] font-mono text-muted-foreground">UOK/2023/BIT/042</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">Record B (Musanze Campus)</span>
                    <span className="font-semibold block mt-0.5">Jean Paul Habimana</span>
                    <span className="text-[10px] font-mono text-muted-foreground">uok-2023-bit-042</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">National ID Agreement</span>
                    <span className="font-semibold text-emerald-600">100% Match</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Jaro-Winkler Name Similarity</span>
                    <span className="font-semibold text-emerald-600">97.8% Match</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Phone Number Format Agreement</span>
                    <span className="font-semibold text-emerald-600">100% Match</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 mt-2">
                  <p className="text-[11px] font-semibold text-primary">Human-in-the-Loop Confirmation</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Records are never merged automatically. Registry Staff review the side-by-side evidence before consolidating into a master record.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Variations Handled */}
        <section id="duplicate-handling" className="border-b py-16 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Intelligent Data Cleaning</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
                Discrepancies Handled Automatically
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                The system normalizes records before comparison, handling typographical errors, format variances, and missing information.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {duplicateVariations.map((item) => (
                <div key={item.title} className="rounded-xl border bg-card p-5 space-y-3">
                  <h3 className="font-semibold text-xs leading-snug">{item.title}</h3>
                  <div className="rounded-md border p-2.5 bg-muted/30 text-[11px] font-mono space-y-1">
                    <p className="text-foreground font-medium">A: {item.exampleA}</p>
                    <p className="text-muted-foreground">B: {item.exampleB}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    {item.matchType}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline Workflows */}
        <section id="how-it-works" className="border-b py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Methodology</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
                4-Stage Deduplication & Consolidation Pipeline
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {workflows.map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="rounded-xl border p-6 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={20} />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground font-semibold">{step}</span>
                  </div>
                  <h3 className="mt-5 text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portals & Roles */}
        <section id="portals" className="border-b py-16 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">System Access</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
                Role-Based Portals & Responsibilities
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Student */}
              <div className="rounded-xl border bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <GraduationCap size={20} />
                  </div>
                  <h3 className="font-bold text-base">Student Portal</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Submit personal and academic records, search allowed institutional records, and run pre-registration duplicate checks. Protected by privacy rules.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-6 w-full">
                  <Link href="/auth/login">Student Login</Link>
                </Button>
              </div>

              {/* Registry Staff */}
              <div className="rounded-xl border bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Building2 size={20} />
                  </div>
                  <h3 className="font-bold text-base">Registry Staff Portal</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Import CSV datasets, validate cohort data, run multi-attribute deduplication, review matching candidates side-by-side, and execute non-destructive master merges.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-6 w-full">
                  <Link href="/auth/login">Staff Login</Link>
                </Button>
              </div>

              {/* Administrator */}
              <div className="rounded-xl border bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-bold text-base">Administrator Console</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Access system reports, monitor audit activities, manage system users and roles, calibrate machine learning model thresholds, and oversee deduplication operations.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-6 w-full">
                  <Link href="/auth/login">Admin Login</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <School size={15} />
            <span className="font-semibold text-foreground">University of Kigali</span>
            <span>· Registry Records & Deduplication System</span>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/auth/register" className="hover:text-foreground transition-colors">Register Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
