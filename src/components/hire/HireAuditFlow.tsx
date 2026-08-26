"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  FileText,
  HelpCircle,
  Inbox,
  Loader2,
  Mail,
  PhoneCall,
  Send,
  ScrollText,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { HireGate } from "@/components/hire/HireGate";
import type { DiscoveryState, HireProposal } from "@/lib/hire/types";
import { emptyDiscovery } from "@/lib/hire/types";
import { HIRE_OPENING, HIRE_PAGE } from "@/lib/hire/copy";
import { getHireProgress } from "@/lib/hire/progress";
import { trackSiteEvent } from "@/lib/analytics/client";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

type ChatBubble = { id: string; role: "user" | "assistant"; content: string };

const triageIcons: Record<string, typeof PhoneCall> = {
  leads: PhoneCall,
  admin: Inbox,
  visibility: BarChart3,
  bids: ScrollText,
  docs: FileText,
  unsure: HelpCircle,
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ProgressBar({ discovery }: { discovery: DiscoveryState }) {
  const steps = getHireProgress(discovery);
  return (
    <div className="border-b border-white/10 px-3 py-3 sm:px-5">
      <ol className="flex items-center justify-between gap-1">
        {steps.map((s, i) => (
          <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  s.done
                    ? "bg-orange-500 text-white"
                    : s.current
                      ? "border border-orange-400/70 text-orange-300"
                      : "border border-white/15 text-zinc-600"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span
                className={`truncate text-[10px] sm:text-xs ${
                  s.current
                    ? "font-medium text-zinc-200"
                    : s.done
                      ? "text-zinc-400"
                      : "text-zinc-600"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mb-4 h-px flex-1 ${
                  s.done ? "bg-orange-500/50" : "bg-white/10"
                }`}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HireAuditFlow() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([
    { id: "opening", role: "assistant", content: HIRE_OPENING },
  ]);
  const [discovery, setDiscovery] = useState<DiscoveryState>(emptyDiscovery());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(false);
  const [teaserLine, setTeaserLine] = useState<string | null>(null);
  const [proposal, setProposal] = useState<HireProposal | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/hire/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "hire_page" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not start");
        if (!cancelled) {
          setSessionId(data.sessionId);
          trackSiteEvent({
            eventName: "hire_session_started",
            source: "hire_page",
            sessionId: data.sessionId,
          });
          if (data.opening) {
            setMessages([
              { id: "opening", role: "assistant", content: data.opening },
            ]);
          }
          if (data.discovery) setDiscovery(data.discovery);
        }
      } catch (e) {
        if (!cancelled) {
          setBootError(
            e instanceof Error ? e.message : "Couldn't start. Refresh."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const scroller = bottomRef.current?.parentElement;
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, [messages, busy, showGate]);

  async function send(e?: FormEvent, overrideText?: string) {
    e?.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || busy || !sessionId || showGate) return;

    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: text }]);
    trackSiteEvent({
      eventName: overrideText ? "hire_triage_selected" : "hire_chat_message_sent",
      source: "hire_page",
      sessionId,
      metadata: {
        messageCount: messages.length + 1,
        triage: Boolean(overrideText),
      },
    });

    try {
      const res = await fetch("/api/hire/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          messages: messages.map(({ role, content }) => ({ role, content })),
          discovery,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: data.reply as string },
      ]);

      if (data.discovery) setDiscovery(data.discovery);
      if (data.proposal) setProposal(data.proposal);

      if (data.readyForGate) {
        setProposal(data.proposal);
        setTeaserLine(data.teaserLine);
        setShowGate(true);
        trackSiteEvent({
          eventName: "hire_gate_shown",
          source: "hire_page",
          sessionId: data.sessionId ?? sessionId,
          metadata: {
            phase: data.phase,
            hasProposal: Boolean(data.proposal),
          },
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "Something glitched — try that again.",
        },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="relative flex flex-1 flex-col pt-24 sm:pt-28">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(255,106,0,0.14), transparent 55%)",
          }}
        />

        <section id="audit" className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-5 sm:px-6">
          <header className="space-y-3 pb-5 pt-4 text-center sm:pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
              {HIRE_PAGE.eyebrow}
            </p>
            <h1 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-[1.08] tracking-tight text-zinc-50 sm:text-5xl">
              {HIRE_PAGE.headline}
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              {HIRE_PAGE.subhead}
            </p>
            <ul className="mx-auto grid max-w-xl grid-cols-1 gap-2 pt-2 text-left sm:grid-cols-2">
              {HIRE_PAGE.proofPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-400" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-zinc-500">
              {HIRE_PAGE.microcopy}
            </p>
          </header>

          <div className="mb-4 grid gap-2 text-sm text-zinc-400 sm:grid-cols-3">
            {["No obligation", "Useful even if we do not build", "Human judgment stays in control"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
                {item}
              </div>
            ))}
          </div>

          <div className="mb-4 rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-4 sm:rounded-3xl sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                  {HIRE_PAGE.routingEyebrow}
                </p>
                <h2 className="mt-2 font-display text-xl font-bold leading-tight text-zinc-50 sm:text-2xl">
                  {HIRE_PAGE.routingTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  {HIRE_PAGE.routingBody}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <a
                  href={PRIMARY_PHONE_HREF}
                  onClick={() =>
                    sessionId &&
                    trackSiteEvent({
                      eventName: "hire_direct_call_clicked",
                      source: "hire_page",
                      sessionId,
                    })
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <PhoneCall className="h-4 w-4" />
                  Call {PRIMARY_PHONE_DISPLAY}
                </a>
                <a
                  href="mailto:contact@247roi.com?subject=AI%20Opportunity%20Audit"
                  onClick={() =>
                    sessionId &&
                    trackSiteEvent({
                      eventName: "hire_direct_email_clicked",
                      source: "hire_page",
                      sessionId,
                    })
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-zinc-100 transition hover:border-orange-400/70 hover:text-orange-200"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {HIRE_PAGE.routingProof.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/services"
              onClick={() =>
                sessionId &&
                trackSiteEvent({
                  eventName: "hire_services_route_clicked",
                  source: "hire_page",
                  sessionId,
                })
              }
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-300 hover:text-orange-200"
            >
              See service paths
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {messages.length <= 1 && !showGate && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 sm:rounded-3xl sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
                    {HIRE_PAGE.triageEyebrow}
                  </p>
                  <h2 className="mt-2 font-display text-xl font-bold leading-tight text-zinc-50 sm:text-2xl">
                    {HIRE_PAGE.triageTitle}
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-zinc-500">
                  {HIRE_PAGE.triageNote}
                </p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {HIRE_PAGE.triageChoices.map((choice) => {
                  const Icon = triageIcons[choice.id] ?? HelpCircle;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={!sessionId || busy}
                      onClick={() => void send(undefined, choice.message)}
                      className="group flex min-h-28 items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-orange-500/60 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-orange-400 transition group-hover:bg-orange-500 group-hover:text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-zinc-100">
                          {choice.title}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-zinc-500">
                          {choice.body}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/85 shadow-[0_0_80px_rgba(0,0,0,0.35)] sm:rounded-3xl">
            <ProgressBar discovery={discovery} />

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[94%] whitespace-pre-wrap rounded-2xl px-4 py-3.5 text-base leading-relaxed sm:max-w-[88%] sm:rounded-3xl sm:px-5 sm:py-4 sm:text-lg ${
                        m.role === "user"
                          ? "bg-orange-500 font-medium text-white"
                          : "border border-white/10 bg-white/[0.05] text-zinc-100"
                      }`}
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {busy && (
                <div className="flex items-center gap-2 text-base text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                  {HIRE_PAGE.busy}
                </div>
              )}
              {bootError && <p className="text-base text-red-400">{bootError}</p>}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={send}
              className="border-t border-white/10 bg-black/40 p-3 sm:p-5"
            >
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={!sessionId || busy || showGate}
                  placeholder={
                    showGate
                      ? HIRE_PAGE.placeholderLocked
                      : HIRE_PAGE.placeholder
                  }
                  className="min-h-[52px] flex-1 resize-none rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/25 disabled:opacity-60 sm:min-h-[64px] sm:text-lg"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!sessionId || busy || !input.trim() || showGate}
                  className="h-[52px] w-[52px] shrink-0 rounded-2xl sm:h-[64px] sm:w-[64px]"
                  aria-label="Send"
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-zinc-600 sm:text-sm">
                {HIRE_PAGE.sendHint}
              </p>
            </form>
          </div>
        </section>
      </main>

      {showGate && sessionId && (
        <HireGate
          sessionId={sessionId}
          teaserLine={teaserLine}
          employeeName={proposal?.employeeName}
          hoursLabel={
            proposal
              ? `${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`
              : undefined
          }
          proposal={proposal}
          discovery={discovery}
          messages={messages.map(({ role, content }) => ({ role, content }))}
          onUnlocked={(id) => {
            router.push(`/hire/${id}`);
          }}
        />
      )}
    </div>
  );
}
