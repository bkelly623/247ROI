"use client";

import { BrowserChrome } from "./BrowserChrome";

type Provider = "chatgpt" | "claude" | "gemini";

const SKINS: Record<
  Provider,
  { url: string; label: string; bg: string; userBg: string; botBg: string }
> = {
  chatgpt: {
    url: "https://chatgpt.com",
    label: "ChatGPT",
    bg: "bg-[#212121]",
    userBg: "bg-[#303030] text-white",
    botBg: "bg-transparent text-[#ececec]",
  },
  claude: {
    url: "https://claude.ai",
    label: "Claude",
    bg: "bg-[#f5f0e8]",
    userBg: "bg-[#e8e0d4] text-[#1a1a1a]",
    botBg: "bg-white text-[#1a1a1a] border border-[#e8e0d4]",
  },
  gemini: {
    url: "https://gemini.google.com",
    label: "Gemini",
    bg: "bg-[#131314]",
    userBg: "bg-[#28292a] text-[#e3e3e3]",
    botBg: "bg-[#1e1f20] text-[#e3e3e3]",
  },
};

export function LiveAIWindow({
  provider,
  query,
  response,
  streaming,
  unavailable,
  mentionedClient,
  active,
}: {
  provider: Provider;
  query: string;
  response: string;
  streaming: boolean;
  unavailable?: string;
  mentionedClient: boolean | null;
  active: boolean;
}) {
  const skin = SKINS[provider];

  return (
    <BrowserChrome
      url={skin.url}
      className={active ? "ring-2 ring-primary/50" : "opacity-80"}
    >
      <div className={`min-h-[280px] p-4 ${skin.bg}`}>
        <p className="mb-3 text-center text-xs font-medium text-zinc-500">
          {skin.label}
        </p>

        {unavailable ? (
          <p className="text-center text-sm text-red-400">{unavailable}</p>
        ) : (
          <div className="space-y-4">
            {query && (
              <div className="flex justify-end">
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${skin.userBg}`}
                >
                  {query}
                </div>
              </div>
            )}
            {(response || streaming) && (
              <div className="flex justify-start">
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${skin.botBg}`}
                >
                  {response}
                  {streaming && (
                    <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-current" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {mentionedClient === false && response && !streaming && (
          <p className="mt-4 text-center text-xs font-semibold text-red-400">
            Not recommended in this response
          </p>
        )}
        {mentionedClient === true && !streaming && (
          <p className="mt-4 text-center text-xs font-semibold text-emerald-400">
            ✓ Your business was mentioned
          </p>
        )}
      </div>
    </BrowserChrome>
  );
}
