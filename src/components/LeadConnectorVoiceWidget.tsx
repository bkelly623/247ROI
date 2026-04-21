"use client";

import { useMemo, useState } from "react";
import Script from "next/script";
import { MessageSquareDot } from "lucide-react";

const WIDGET_SCRIPT_SRC = "https://widgets.leadconnectorhq.com/loader.js";
const WIDGET_RESOURCES_URL = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";
const WIDGET_ID = "69e7826129e846f2447559ff";

function tryOpenLeadConnectorWidget() {
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

export default function LeadConnectorVoiceWidget() {
  const [isLoaded, setIsLoaded] = useState(false);
  const statusText = useMemo(
    () => (isLoaded ? "Voice AI chat is ready." : "Loading voice AI chat..."),
    [isLoaded],
  );

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <Script
        id="leadconnector-chat-widget"
        src={WIDGET_SCRIPT_SRC}
        strategy="afterInteractive"
        data-resources-url={WIDGET_RESOURCES_URL}
        data-widget-id={WIDGET_ID}
        onLoad={() => setIsLoaded(true)}
      />

      <button
        type="button"
        onClick={() => {
          void tryOpenLeadConnectorWidget();
        }}
        className="group relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-black border border-primary/40 shadow-[0_0_40px_hsl(174_72%_56%/0.35),0_0_80px_hsl(174_72%_56%/0.15),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:scale-[1.04] hover:border-primary/60 hover:shadow-[0_0_56px_hsl(174_72%_56%/0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        aria-label="Open voice AI chat"
      >
        <span className="absolute inset-0 rounded-full opacity-40 group-hover:opacity-60 transition-opacity bg-[radial-gradient(circle_at_50%_35%,hsl(174_72%_56%/0.5),transparent_55%)]" />
        <MessageSquareDot
          className="relative h-12 w-12 sm:h-14 sm:w-14 text-primary drop-shadow-[0_0_12px_hsl(174_72%_56%/0.8)]"
          strokeWidth={1.75}
        />
      </button>

      <p className="text-center text-[13px] text-zinc-400 max-w-xs leading-snug">{statusText}</p>
      <p className="text-center text-[12px] text-zinc-500 max-w-xs leading-snug">
        Tap to launch your Voice AI chat widget.
      </p>
    </div>
  );
}
