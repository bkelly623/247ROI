"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareDot } from "lucide-react";

export function tryOpenLeadConnectorVoiceWidget() {
  if (typeof document === "undefined") return false;

  const selectors = [
    "button[aria-label*='chat' i]",
    "button[aria-label*='message' i]",
    "[data-chat-widget] button",
    ".hl-chat-widget button",
    ".lcw-widget button",
  ];

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      el.click();
      return true;
    }
  }

  return false;
}

type LeadConnectorVoiceLauncherProps = {
  /** Called after we detect the external widget likely injected its controls */
  onReadyChange?: (ready: boolean) => void;
};

export default function LeadConnectorVoiceLauncher({ onReadyChange }: LeadConnectorVoiceLauncherProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const started = performance.now();
    const maxMs = 20000;

    const loop = () => {
      if (cancelled) return;
      const hit = document.querySelector(
        "button[aria-label*='chat' i], button[aria-label*='message' i], .hl-chat-widget, .lcw-widget, [data-chat-widget]",
      );
      if (hit) {
        setReady(true);
        onReadyChange?.(true);
        return;
      }
      if (performance.now() - started > maxMs) {
        setReady(false);
        onReadyChange?.(false);
        return;
      }
      raf = window.requestAnimationFrame(loop);
    };

    raf = window.requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [onReadyChange]);

  const statusText = useMemo(
    () => (ready ? "Widget is ready — tap to talk." : "Loading AI receptionist…"),
    [ready],
  );

  return (
    <div className="flex flex-col items-center justify-center gap-5 w-full">
      <button
        type="button"
        onClick={() => {
          void tryOpenLeadConnectorVoiceWidget();
        }}
        className="group relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-black border border-primary/40 shadow-[0_0_40px_hsl(174_72%_56%/0.35),0_0_80px_hsl(174_72%_56%/0.15),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:scale-[1.04] hover:border-primary/60 hover:shadow-[0_0_56px_hsl(174_72%_56%/0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 touch-manipulation min-h-[7rem] min-w-[7rem] sm:min-h-[8rem] sm:min-w-[8rem]"
        aria-label="Open AI receptionist voice chat"
      >
        <span className="absolute inset-0 rounded-full opacity-40 group-hover:opacity-60 transition-opacity bg-[radial-gradient(circle_at_50%_35%,hsl(174_72%_56%/0.5),transparent_55%)]" />
        <MessageSquareDot
          className="relative h-12 w-12 sm:h-14 sm:w-14 text-primary drop-shadow-[0_0_12px_hsl(174_72%_56%/0.8)]"
          strokeWidth={1.75}
        />
      </button>

      <p className="text-center text-[13px] text-zinc-400 max-w-sm leading-snug px-1">{statusText}</p>
    </div>
  );
}
