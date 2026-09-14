import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  HeartPulse,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fastSteps = [
  { letter: "F", title: "Face", description: "Ask the person to smile. Is one side drooping?" },
  { letter: "A", title: "Arms", description: "Ask them to raise both arms. Does one drift down?" },
  { letter: "S", title: "Speech", description: "Ask them to repeat a phrase. Is speech slurred?" },
  { letter: "T", title: "Time", description: "If you see any sign, call emergency services now." },
];

const workflow = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Record symptoms",
    description: "Complete a guided symptom check and describe what you are experiencing.",
  },
  {
    number: "02",
    icon: Brain,
    title: "Understand the risk",
    description: "Receive a clear risk level, confidence score, FAST score, and next-step guidance.",
  },
  {
    number: "03",
    icon: UserRoundCheck,
    title: "Connect with a doctor",
    description: "Assign an approved doctor who can review the assessment and leave clinical comments.",
  },
];

const platformPoints = [
  "Secure patient assessment history",
  "Approved doctor review workflow",
  "High-risk alerts and notifications",
  "Administrative oversight and audit logs",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="StrokeCheck home">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HeartPulse size={16} />
            </span>
            <span className="text-sm font-semibold tracking-tight">StrokeCheck</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
            <a href="#fast" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Know FAST</a>
            <a href="#for-care-teams" className="text-sm text-muted-foreground transition-colors hover:text-foreground">For care teams</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">Get started <ArrowRight size={14} /></Link>
            </Button>
            <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Browse page sections" asChild>
              <a href="#how-it-works"><Menu size={17} /></a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-32">
            <div>
              <Badge variant="outline" className="mb-6 rounded-full px-3 py-1 font-normal">
                <Activity size={12} /> Early awareness matters
              </Badge>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Recognize stroke risk. Act with clarity.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                StrokeCheck helps patients record warning signs, understand risk,
                and share assessments with approved doctors for timely review.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/auth/register">Start a symptom check <ArrowRight size={15} /></Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#fast">Learn the FAST signs</a>
                </Button>
              </div>
              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                StrokeCheck supports awareness and clinical review. It does not replace emergency services or a medical diagnosis.
              </p>
            </div>

            <div className="relative">
              <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between border-b pb-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assessment preview</p>
                    <p className="mt-1 text-sm font-medium">Stroke risk summary</p>
                  </div>
                  <Badge variant="destructive">High risk</Badge>
                </div>
                <div className="grid gap-6 py-6 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div className="flex size-28 flex-col items-center justify-center rounded-full border-[6px] border-destructive/20">
                    <span className="text-2xl font-semibold">86%</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">FAST score</span>
                        <span className="font-medium">3 of 4</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["F", "A", "S", "T"].map((letter, index) => (
                          <span
                            key={letter}
                            className={index < 3 ? "flex h-8 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-xs font-semibold text-destructive" : "flex h-8 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground"}
                          >
                            {letter}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs text-muted-foreground">Detected signs</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Facial drooping", "Arm weakness", "Speech difficulty"].map((sign) => (
                          <span key={sign} className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">{sign}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-xs font-medium text-destructive">Seek emergency care immediately</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Call emergency services. Do not wait for symptoms to improve.</p>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden w-52 rounded-lg border bg-background p-4 shadow-sm sm:block">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-muted"><Stethoscope size={13} /></span>
                  <div>
                    <p className="text-xs font-medium">Doctor review</p>
                    <p className="text-[10px] text-muted-foreground">Assigned and notified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/30">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px border-x bg-border sm:grid-cols-4">
            {[
              ["Patients", "Guided symptom assessments"],
              ["Doctors", "Assigned clinical reviews"],
              ["Administrators", "Verified care oversight"],
              ["Every assessment", "Clear history and alerts"],
            ].map(([title, description]) => (
              <div key={title} className="bg-background p-5 sm:p-6">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-b">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">From symptoms to a reviewed assessment</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">A straightforward workflow designed to help people document concerns and connect with an approved medical professional.</p>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {workflow.map(({ number, icon: Icon, title, description }) => (
                <div key={number} className="rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-md bg-muted"><Icon size={16} /></span>
                    <span className="font-mono text-xs text-muted-foreground">{number}</span>
                  </div>
                  <h3 className="mt-8 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fast" className="scroll-mt-20 border-b">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Know the signs</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Think FAST</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Stroke symptoms can begin suddenly. Knowing these four steps can help you recognize warning signs and act quickly.
              </p>
              <div className="mt-7 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Clock3 size={17} className="mt-0.5 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">Do not wait</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Call emergency services immediately when stroke signs appear. Every minute matters.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fastSteps.map((step) => (
                <div key={step.letter} className="flex gap-4 rounded-lg border p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">{step.letter}</span>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="for-care-teams" className="scroll-mt-20 border-b bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div className="rounded-xl border bg-background p-5 sm:p-7">
              <div className="flex items-center gap-3 border-b pb-5">
                <span className="flex size-9 items-center justify-center rounded-md bg-muted"><MessageSquareText size={16} /></span>
                <div>
                  <p className="text-sm font-medium">Connected care workflow</p>
                  <p className="text-xs text-muted-foreground">Built around clear responsibility</p>
                </div>
              </div>
              <div className="divide-y">
                {[
                  ["Patient", "Completes an assessment and selects an approved doctor."],
                  ["Doctor", "Reviews assigned results and sends a clinical comment."],
                  ["Administrator", "Approves doctors, monitors feedback, and manages access."],
                ].map(([role, detail]) => (
                  <div key={role} className="flex gap-4 py-5">
                    <Check size={15} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{role}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">One coordinated platform</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Useful for patients. Accountable for care teams.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                StrokeCheck brings assessment history, doctor assignment, clinical comments, notifications, and administrative controls into one focused experience.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {platformPoints.map((point) => (
                  <div key={point} className="flex items-center gap-2.5 text-sm">
                    <span className="flex size-5 items-center justify-center rounded-full border"><Check size={11} /></span>
                    {point}
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" className="mt-8">
                <Link href="/auth/register">Create an account <ChevronRight size={14} /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="rounded-xl border bg-primary px-6 py-12 text-primary-foreground sm:px-10 sm:py-14">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60">Start today</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Be better prepared when warning signs appear.</h2>
                  <p className="mt-4 text-sm leading-6 text-primary-foreground/70">Create your secure account, document symptoms, and connect assessments with approved doctors.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/auth/register">Create account <ArrowRight size={15} /></Link>
                  </Button>
                  <Button asChild size="lg" className="border border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                    <Link href="/auth/login">Sign in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <HeartPulse size={15} />
            <span className="text-sm font-medium">StrokeCheck</span>
          </div>
          <p className="max-w-xl text-xs leading-5 text-muted-foreground">For awareness and decision support only. If you suspect a stroke, contact emergency services immediately.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/auth/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/auth/register" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
