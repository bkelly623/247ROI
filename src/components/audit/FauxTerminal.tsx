"use client";

import { useEffect, useState } from "react";

interface FauxTerminalProps {
  lines: string[];
  intervalMs?: number;
  autoStart?: boolean;
  className?: string;
}

export function FauxTerminal({
  lines,
  intervalMs = 1800,
  autoStart = true,
  className,
}: FauxTerminalProps) {
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    if (!autoStart || lines.length === 0) return;
    setVisible([]);
    let i = 0;
    const id = setInterval(() => {
      if (i < lines.length && lines[i]) {
        const ts = new Date().toLocaleTimeString();
        const line = String(lines[i]).trim();
        if (line) setVisible((prev) => [...prev, `[${ts}] ${line}`]);
        i++;
      } else {
        clearInterval(id);
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [lines, intervalMs, autoStart]);

  return (
    <div
      className={`w-full rounded-lg border border-zinc-800 bg-black p-4 font-mono text-xs text-zinc-400 shadow-inner ${className ?? ""}`}
    >
      <div className="mb-2 flex items-center gap-2 border-b border-zinc-900 pb-2 text-zinc-500">
        <span className="h-2 w-2 rounded-full bg-red-500/50" />
        <span className="h-2 w-2 rounded-full bg-yellow-500/50" />
        <span className="h-2 w-2 rounded-full bg-green-500/50" />
        <span>247roi-infrastructure-stream.log</span>
      </div>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {visible.map((line, idx) => (
          <div key={idx} className="animate-fade-in text-emerald-400/90">
            {line}
          </div>
        ))}
        {visible.length < lines.length && (
          <div className="animate-pulse text-zinc-600">▌ processing...</div>
        )}
      </div>
    </div>
  );
}
