"use client";

import { useEffect, useState } from "react";
import { BrowserChrome } from "./BrowserChrome";

export function LiveGoogleWindow({
  typingQuery,
  searching,
  results,
  clientFound,
  active,
}: {
  typingQuery: string;
  searching: boolean;
  results: Array<{
    position: number;
    name: string;
    rating?: number;
    reviewCount?: number;
    address?: string;
    isClient?: boolean;
  }>;
  clientFound: boolean | null;
  active: boolean;
}) {
  const [displayed, setDisplayed] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!typingQuery) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    setVisibleCount(0);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(typingQuery.slice(0, i));
      if (i >= typingQuery.length) clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [typingQuery]);

  useEffect(() => {
    if (results.length > visibleCount) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), 300);
      return () => clearTimeout(t);
    }
  }, [results, visibleCount]);

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(typingQuery || "")}`;

  return (
    <BrowserChrome
      url={searchUrl}
      className={active ? "ring-2 ring-primary/50" : "opacity-80"}
    >
      <div className="min-h-[340px] bg-white p-6 text-zinc-900">
        <div className="mb-6 flex justify-center">
          <span className="text-3xl font-medium tracking-tight">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </span>
        </div>

        <div className="mx-auto mb-6 flex max-w-xl items-center gap-3 rounded-full border border-zinc-200 px-5 py-3 shadow-md">
          <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="flex-1 text-sm">
            {displayed}
            {displayed.length < typingQuery.length && (
              <span className="animate-pulse">|</span>
            )}
          </span>
        </div>

        {searching && results.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#4285F4]" />
          </div>
        )}

        <div className="mx-auto max-w-2xl space-y-4">
          {results.slice(0, visibleCount).map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              className={`animate-fade-in rounded-lg p-2 ${
                r.isClient ? "bg-blue-50 ring-2 ring-[#4285F4]" : ""
              }`}
            >
              <p className="text-xs text-[#202124]">
                {r.position > 0 ? `#${r.position} · Local result` : "Local"}
              </p>
              <p className="text-lg text-[#1a0dab] hover:underline">{r.name}</p>
              {r.address && (
                <p className="text-sm text-[#4d5156]">{r.address}</p>
              )}
              {r.rating && (
                <p className="text-sm text-[#70757a]">
                  ★ {r.rating}
                  {r.reviewCount ? ` (${r.reviewCount} reviews)` : ""}
                </p>
              )}
            </div>
          ))}
        </div>

        {clientFound === false && results.length > 0 && visibleCount >= results.length && (
          <p className="mt-6 text-center text-sm font-semibold text-red-600">
            Your business is not in these results.
          </p>
        )}
        {clientFound === true && (
          <p className="mt-6 text-center text-sm font-semibold text-[#137333]">
            ✓ Your business appears in Google local results.
          </p>
        )}
      </div>
    </BrowserChrome>
  );
}
