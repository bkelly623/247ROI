"use client";

import { ReactNode } from "react";

export function BrowserChrome({
  url,
  children,
  className = "",
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-800 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-md bg-zinc-950 px-3 py-1">
          <span className="text-[10px] text-zinc-500">🔒</span>
          <span className="truncate font-mono text-[11px] text-zinc-300">
            {url}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
