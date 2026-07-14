"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { HireGate } from "@/components/hire/HireGate";
import type { DiscoveryState, HireMessage, HireProposal } from "@/lib/hire/types";
import { emptyDiscovery } from "@/lib/hire/types";
import { HIRE_OPENING } from "@/lib/hire/copy";

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
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(false);
  const [teaserLine, setTeaserLine] = useState<string | null>(null);
  const [proposal, setProposal] = useState<HireProposal | null>(null);
  const [phaseLabel, setPhaseLabel] = useState("Scanning desk load");
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
        }
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : "Failed to start audit");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

      if (data.phase === "time_verify") setPhaseLabel("Verifying hours (people lie to themselves)");
      else if (data.phase === "process") setPhaseLabel("Mapping the workflow A→Z");
      else if (data.phase === "pain2_probe") setPhaseLabel("Hunting a second time thief");
      else if (data.phase === "ready") setPhaseLabel("Drafting your first hire");
      else if (data.phase === "pain1") setPhaseLabel("Naming the desk villain");
      else setPhaseLabel("Warming up the staffing unit");

      if (data.readyForGate) {
        setProposal(data.proposal);
        setTeaserLine(data.teaserLine);
        setShowGate(true);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content:
            err instanceof Error
              ? `Glitch on my end: ${err.message}. Try that again.`
              : "Glitch. Hit me again.",
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
      <main className="relative flex flex-1 flex-col pt-20">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,106,0,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 20%, rgba(56,189,248,0.08), transparent 50%)",
          }}
        />

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 sm:px-6">
          <header className="mb-6 space-y-3 pt-6 text-center sm:pt-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300"
            >
              <Bot className="h-3.5 w-3.5" />
              AI Employee Audit · UNIT-247
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl"
            >
              247ROI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto max-w-xl text-base text-zinc-400 sm:text-lg"
            >
              Find the first AI employee that pays for itself. We dig into desk time until the
              math — and the relief — get honest.
            </motion.p>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">{phaseLabel}</p>
          </header>

          <div className="flex min-h-[52vh] flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 shadow-[0_0_60px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs text-zinc-500">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              Live staffing consult · no fluff forms
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] ${
                        m.role === "user"
                          ? "bg-orange-500 text-white"
                          : "border border-white/10 bg-white/[0.04] text-zinc-200"
                      }`}
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {busy && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" />
                  UNIT-247 is poking the wound…
                </div>
              )}
              {bootError && (
                <p className="text-sm text-red-400">{bootError}</p>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={send}
              className="border-t border-white/10 bg-black/30 p-3 sm:p-4"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={!sessionId || busy || showGate}
                  placeholder={
                    showGate
                      ? "Unlock the hire plan to continue…"
                      : "Tell me what's eating your desk time…"
                  }
                  className="min-h-[52px] flex-1 resize-none rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30 disabled:opacity-60"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!sessionId || busy || !input.trim() || showGate}
                  className="h-[52px] shrink-0 px-4"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-zinc-600">
                Enter to send · Shift+Enter for newline · We verify hours with math, not vibes
              </p>
            </form>
          </div>
        </section>
      </main>
      <Footer />

      {showGate && sessionId && (
        <HireGate
          sessionId={sessionId}
          teaserLine={teaserLine}
          employeeName={proposal?.employeeName}
          hoursLabel={
            proposal
              ? `${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week back`
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
