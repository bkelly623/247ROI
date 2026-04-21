import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Calendar } from "lucide-react";
import { BookingIframe, BookingSmsDisclaimer } from "@/components/BookingEmbed";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

export const metadata: Metadata = {
  title: "Schedule a Call | 247ROI",
  description: "Book a time with 247ROI — AI systems built to capture revenue 24/7 for local businesses.",
};

export default function CalendarPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="lazyOnload" />

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

      <div className="mx-auto flex w-full max-w-5xl flex-1 min-h-0 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 shrink-0 sm:mb-6">
          <div className="mb-2 flex items-center gap-3 text-primary">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25 sm:h-11 sm:w-11">
              <Calendar className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Scheduling
            </p>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-4xl">Schedule a call</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground md:text-base">
            Prefer the fastest path? Call or text{" "}
            <a href={PRIMARY_PHONE_HREF} className="font-semibold text-primary underline underline-offset-2">
              {PRIMARY_PHONE_DISPLAY}
            </a>{" "}
            first. Otherwise, pick a time below — the full flow stays on this page.
          </p>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <BookingIframe
            variant="page"
            wrapperClassName="rounded-xl border-border/80 shadow-lg ring-1 ring-white/5 sm:rounded-2xl"
          />
        </div>

        <div className="mt-4 shrink-0 border-t border-border/40 pt-4">
          <BookingSmsDisclaimer className="!text-left text-[11px] leading-snug sm:!text-center sm:text-[12px]" />
        </div>
      </div>
    </main>
  );
}
