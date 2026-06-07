import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

export const metadata: Metadata = {
  title: "Contact 247ROI | AI Employee Workflow Map",
  description: "Contact 247ROI to map the first AI employee worth building for your business.",
};

export default function CalendarPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            ← Back to home
          </Link>
          <a
            href={PRIMARY_PHONE_HREF}
            className="font-display text-sm font-semibold tabular-nums text-foreground transition-colors hover:text-primary"
          >
            {PRIMARY_PHONE_DISPLAY}
          </a>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Calendar removed</p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
            Start with a workflow map.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            The old booking calendar is no longer active. Call or email with the workflow you want to improve:
            missed calls, follow-up, estimating, bidding, inbox response, or operations coordination.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
              <a href={PRIMARY_PHONE_HREF}>
                <Phone className="mr-2 h-4 w-4" aria-hidden />
                Call {PRIMARY_PHONE_DISPLAY}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]"
            >
              <a href="mailto:contact@247roi.com?subject=AI%20employee%20workflow%20map">
                <Mail className="mr-2 h-4 w-4" aria-hidden />
                Email the workflow
              </a>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
