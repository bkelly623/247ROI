"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { HireGate } from "@/components/hire/HireGate";
import type { DiscoveryState, HireMessage, HireProposal } from "@/lib/hire/types";
import { emptyDiscovery } from "@/lib/hire/types";
import { HIRE_OPENING, HIRE_PAGE } from "@/lib/hire/copy";
import { PAIN_CHOICES, type ChatChoice, type InputMode } from "@/lib/hire/choices";

type ChatBubble = HireMessage & { id: string };

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function HireAuditFlow() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([
    { id: "opening", role: "assistant", content: HIRE_OPENING },
  ]);
  const [discovery, setDiscovery] = useState<DiscoveryState>(emptyDiscovery());
  const [choices, setChoices] = useState<ChatChoice[]>(PAIN_CHOICES);
  const [inputMode, setInputMode] = useState<InputMode>("choices");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(false);
  const [teaserLine, setTeaserLine] = useState<string | null>(null);
  const [proposal, setProposal] = useState<HireProposal | null>(null);
  const [phaseLabel, setPhaseLabel] = useState(HIRE_PAGE.phaseLabels.warming);
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
            setMessages([{ id: "opening", role: "assistant", content: data.opening }]);
          }
          if (data.discovery) setDiscovery(data.discovery);
          if (Array.isArray(data.choices) && data.choices.length) {
            setChoices(data.choices);
          }
          if (data.inputMode) setInputMode(data.inputMode);
        }
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : "Couldn't start. Refresh.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, showGate, choices]);

  async function sendValue(value: string, display?: string) {
    const text = value.trim();
    if (!text || busy || !sessionId || showGate) return;

    setInput("");
    setBusy(true);
    setChoices([]);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: display?.trim() || text },
    ]);

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
      setChoices(Array.isArray(data.choices) ? data.choices : []);
      setInputMode((data.inputMode as InputMode) || (data.choices?.length ? "choices" : "text"));

      const phase = String(data.phase || "warming");
      setPhaseLabel(HIRE_PAGE.phaseLabels[phase] || HIRE_PAGE.phaseLabels.warming);

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
          content: "Something glitched. Tap again or refresh.",
        },
      ]);
      setInputMode("both");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    await sendValue(text);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const showText =
    inputMode === "text" || inputMode === "both" || choices.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="relative flex flex-1 flex-col pt-16 sm:pt-20">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(255,106,0,0.16), transparent 55%)",
          }}
        />

        <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-4 sm:px-6">
          <header className="space-y-3 pb-5 pt-5 text-center sm:pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
              {HIRE_PAGE.eyebrow}
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-zinc-50 sm:text-5xl">
              {HIRE_PAGE.headline}
            </h1>
            <p className="mx-auto max-w-lg text-base text-zinc-400 sm:text-lg">
              {HIRE_PAGE.subhead}
            </p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-[0_0_80px_rgba(0,0,0,0.4)]">
            <div className="border-b border-white/10 px-5 py-3 text-center text-sm font-medium text-zinc-500">
              {phaseLabel}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[95%] whitespace-pre-wrap rounded-3xl px-5 py-4 text-lg leading-snug sm:max-w-[90%] sm:text-xl ${
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

              {!busy && !showGate && choices.length > 0 && (
                <div className="flex flex-col gap-2.5 pt-1">
                  {choices.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!sessionId || busy}
                      onClick={() => void sendValue(c.value, c.label)}
                      className="rounded-2xl border border-white/15 bg-zinc-900/90 px-4 py-3.5 text-left text-base font-medium text-zinc-100 transition hover:border-orange-500/50 hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50 sm:text-lg"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              {busy && (
                <div className="flex items-center gap-2 text-base text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                  {HIRE_PAGE.busy}
                </div>
              )}
              {bootError && <p className="text-base text-red-400">{bootError}</p>}
              <div ref={bottomRef} />
            </div>

            {showText && (
              <form
                onSubmit={send}
                className="border-t border-white/10 bg-black/40 p-4 sm:p-5"
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
                        : inputMode === "text"
                          ? HIRE_PAGE.placeholderOther
                          : HIRE_PAGE.placeholder
                    }
                    className="min-h-[64px] flex-1 resize-none rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-lg text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/25 disabled:opacity-60 sm:text-xl"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!sessionId || busy || !input.trim() || showGate}
                    className="h-[64px] w-[64px] shrink-0 rounded-2xl"
                    aria-label="Send"
                  >
                    {busy ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="mt-3 text-center text-sm text-zinc-600">
                  {choices.length > 0 ? HIRE_PAGE.sendHint : "Press Enter to send"}
                </p>
              </form>
            )}

            {!showText && !showGate && (
              <div className="border-t border-white/10 px-4 py-3 text-center text-sm text-zinc-600">
                Tap an option above
              </div>
            )}
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
