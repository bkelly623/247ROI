"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { HireGate } from "@/components/hire/HireGate";
import type { DiscoveryState, HireProposal } from "@/lib/hire/types";
import { emptyDiscovery } from "@/lib/hire/types";
import { HIRE_OPENING, HIRE_PAGE } from "@/lib/hire/copy";
import { getHireProgress } from "@/lib/hire/progress";

type ChatBubble = { id: string; role: "user" | "assistant"; content: string };

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

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy || !sessionId || showGate) return;

    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: text }]);

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

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-5 sm:px-6">
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
