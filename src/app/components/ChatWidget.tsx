"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, MessageCircle, Send, X } from "lucide-react";
import NavCtaPair from "./NavCtaPair";
import {
  DEMO_PHONE_DISPLAY,
  PRIMARY_PHONE_DISPLAY,
} from "./cta";
import { chatHashIsOpen, clearChatHash, subscribeOpenChat } from "@/lib/openChat";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi — 247ROI helps you turn inbound calls and messages into revenue 24/7. Fastest path: call or text ${PRIMARY_PHONE_DISPLAY}. Want to hear the system? Try the live demo at ${DEMO_PHONE_DISPLAY}. What kind of inbound volume are you handling right now?`,
    },
  ]);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  useEffect(() => {
    const syncFromHash = () => {
      if (chatHashIsOpen()) setOpen(true);
    };
    syncFromHash();
    const unsub = subscribeOpenChat(() => setOpen(true));
    const onHash = () => {
      if (chatHashIsOpen()) setOpen(true);
      else setOpen(false);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      unsub();
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  useEffect(() => {
    if (open) return;
    const hasSeenTip = window.sessionStorage.getItem("chat_tip_seen");
    if (hasSeenTip) return;

    setShowTip(true);
    const timer = window.setTimeout(() => {
      setShowTip(false);
      window.sessionStorage.setItem("chat_tip_seen", "1");
    }, 7000);

    return () => window.clearTimeout(timer);
  }, [open]);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    setInput("");
    setIsLoading(true);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = (await res.json()) as { reply?: string };
      const reply =
        data.reply ??
        `Sorry — I couldn’t respond right now. Call or text ${PRIMARY_PHONE_DISPLAY}. For the live demo, call ${DEMO_PHONE_DISPLAY}.`;

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Something went wrong. Call or text ${PRIMARY_PHONE_DISPLAY} — or try the demo at ${DEMO_PHONE_DISPLAY}.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div aria-live="polite">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-6 right-6 z-[9998] w-[min(380px,calc(100vw-28px))]"
          >
            <div className="relative rounded-[1.35rem] p-[1px] overflow-hidden shadow-[0_0_0_1px_hsl(210_40%_98%/0.08),0_25px_80px_-20px_hsl(0_0%_0%/0.65),0_0_60px_hsl(174_72%_56%/0.12)]">
              <div
                className="absolute -inset-[40%] chat-widget-aurora opacity-90 blur-2xl pointer-events-none"
                aria-hidden
              />
              <div
                ref={panelRef}
                className="relative rounded-[1.3rem] glass-strong overflow-hidden flex flex-col max-h-[min(540px,calc(100vh-120px))] border border-white/[0.08]"
              >
                <div
                  className="absolute inset-0 chat-widget-stars pointer-events-none opacity-70"
                  aria-hidden
                />
                <div className="relative flex items-center justify-between gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-gradient-to-r from-card/80 via-card/40 to-transparent">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-secondary/20 ring-1 ring-primary/30 shadow-[0_0_20px_hsl(174_72%_56%/0.2)]">
                      <Clock className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-[15px] text-foreground tracking-tight truncate">
                        <span className="gradient-text">247ROI</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground tracking-wide">
                        ROI around the clock · fast replies
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      clearChatHash();
                    }}
                    className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                    aria-label="Close chat"
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </button>
                </div>

                <div className="relative flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((m, i) => (
                    <motion.div
                      key={`${i}-${m.role}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                    >
                      <div
                        className={
                          m.role === "user"
                            ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground px-3.5 py-2.5 rounded-2xl rounded-br-md text-[13px] leading-relaxed max-w-[88%] shadow-[0_4px_24px_hsl(174_72%_56%/0.25)]"
                            : "bg-muted/50 backdrop-blur-sm border border-white/[0.07] text-foreground/95 px-3.5 py-2.5 rounded-2xl rounded-bl-md text-[13px] leading-relaxed max-w-[88%]"
                        }
                      >
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading ? (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/[0.06] bg-muted/30">
                        {[0, 1, 2].map((d) => (
                          <motion.span
                            key={d}
                            className="h-1.5 w-1.5 rounded-full bg-primary/80"
                            animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] }}
                            transition={{
                              duration: 0.9,
                              repeat: Infinity,
                              delay: d * 0.18,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div ref={bottomRef} />
                </div>

                <div className="relative px-4 py-3 border-t border-white/[0.08] bg-card/30 backdrop-blur-md">
                  <div className="mb-3">
                    <NavCtaPair
                      compact
                      showDemo
                      showGuarantee={false}
                      primaryLabel="hero"
                      surface="dark"
                      className="w-full"
                    />
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!canSend) return;
                      void send();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask a quick question…"
                      className="flex-1 rounded-xl border border-white/[0.1] bg-background/60 px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-shadow"
                    />
                    <button
                      type="submit"
                      disabled={!canSend}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_hsl(174_72%_56%/0.35)] hover:bg-primary/90 disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed transition-all hover:scale-[1.03] active:scale-[0.98]"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showTip && !open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, x: 4 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.35 }}
            className="fixed bottom-[5.75rem] right-6 z-[9998] max-w-[240px] rounded-xl glass-strong border border-white/10 px-3.5 py-2.5 shadow-[0_12px_40px_-10px_hsl(0_0%_0%/0.5)]"
          >
            <p className="text-[12px] text-foreground/90 leading-snug">
              <span className="text-primary font-medium">Tap the orb</span> — ask anything, or call us
              directly.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center h-16 w-16">
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-40" aria-hidden />
        <motion.span
          className="absolute inset-[-6px] rounded-full border border-primary/25 pointer-events-none"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <motion.button
          type="button"
          onClick={() =>
            setOpen((v) => {
              const next = !v;
              if (!next) clearChatHash();
              return next;
            })
          }
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-[0_0_32px_hsl(174_72%_56%/0.45),0_8px_32px_hsl(262_83%_58%/0.25)] ring-2 ring-white/15 hover:shadow-[0_0_40px_hsl(174_72%_56%/0.55)] transition-shadow"
          aria-label={open ? "Close chat" : "Open chat"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" strokeWidth={2.25} />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <MessageCircle className="h-6 w-6" strokeWidth={2} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
