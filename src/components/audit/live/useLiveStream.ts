"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveEvent } from "@/lib/audit/live-stream";
import type { AuditReport, GoogleLocalResult } from "@/lib/audit/types";

type AIState = {
  query: string;
  response: string;
  streaming: boolean;
  mentioned: boolean | null;
  unavailable?: string;
  active: boolean;
};

export interface LiveStreamState {
  connected: boolean;
  done: boolean;
  businessName: string;
  zipCode: string;
  tradeLabel: string;
  google: {
    query: string;
    searching: boolean;
    results: GoogleLocalResult[];
    clientFound: boolean | null;
    active: boolean;
  };
  chatgpt: AIState;
  gemini: AIState;
  claude: AIState;
  siteMessage: string;
  report: AuditReport | null;
}

const emptyAI = (): AIState => ({
  query: "",
  response: "",
  streaming: false,
  mentioned: null,
  active: false,
});

export function useLiveStream(sessionId: string): LiveStreamState {
  const [state, setState] = useState<LiveStreamState>({
    connected: false,
    done: false,
    businessName: "",
    zipCode: "",
    tradeLabel: "",
    google: {
      query: "",
      searching: false,
      results: [],
      clientFound: null,
      active: true,
    },
    chatgpt: emptyAI(),
    gemini: emptyAI(),
    claude: emptyAI(),
    siteMessage: "",
    report: null,
  });

  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const es = new EventSource(`/api/sessions/${sessionId}/live`);

    es.onopen = () => setState((s) => ({ ...s, connected: true }));

    es.onmessage = (msg) => {
      const event = JSON.parse(msg.data) as LiveEvent;

      switch (event.type) {
        case "init":
          setState((s) => ({
            ...s,
            businessName: event.businessName,
            zipCode: event.zipCode,
            tradeLabel: event.tradeLabel,
          }));
          break;

        case "google_typing":
          setState((s) => ({
            ...s,
            google: {
              query: event.query,
              searching: false,
              results: [],
              clientFound: null,
              active: true,
            },
            chatgpt: { ...s.chatgpt, active: false },
            gemini: { ...s.gemini, active: false },
            claude: { ...s.claude, active: false },
          }));
          break;

        case "google_searching":
          setState((s) => ({
            ...s,
            google: { ...s.google, searching: true },
          }));
          break;

        case "google_result":
          setState((s) => ({
            ...s,
            google: {
              ...s.google,
              results: [...s.google.results, event.result],
              searching: false,
            },
          }));
          break;

        case "google_done":
          setState((s) => ({
            ...s,
            google: {
              ...s.google,
              clientFound: event.clientFound,
              searching: false,
              active: false,
            },
          }));
          break;

        case "ai_start":
          setState((s) => ({
            ...s,
            google: { ...s.google, active: false },
            chatgpt: {
              ...s.chatgpt,
              active: event.provider === "chatgpt",
              ...(event.provider === "chatgpt"
                ? {
                    query: event.query,
                    response: "",
                    streaming: true,
                    mentioned: null,
                    unavailable: undefined,
                  }
                : {}),
            },
            gemini: {
              ...s.gemini,
              active: event.provider === "gemini",
              ...(event.provider === "gemini"
                ? {
                    query: event.query,
                    response: "",
                    streaming: true,
                    mentioned: null,
                    unavailable: undefined,
                  }
                : {}),
            },
            claude: {
              ...s.claude,
              active: event.provider === "claude",
              ...(event.provider === "claude"
                ? {
                    query: event.query,
                    response: "",
                    streaming: true,
                    mentioned: null,
                    unavailable: undefined,
                  }
                : {}),
            },
          }));
          break;

        case "ai_token": {
          const p = event.provider;
          setState((s) => ({
            ...s,
            [p]: {
              ...s[p],
              response: s[p].response + event.token,
              streaming: true,
              active: true,
            },
          }));
          break;
        }

        case "ai_done": {
          const p = event.provider;
          setState((s) => ({
            ...s,
            [p]: {
              ...s[p],
              streaming: false,
              mentioned: event.mentionedClient,
              active: false,
            },
          }));
          break;
        }

        case "ai_unavailable": {
          const p = event.provider;
          setState((s) => ({
            ...s,
            [p]: {
              ...s[p],
              unavailable: event.reason,
              streaming: false,
              active: false,
            },
          }));
          break;
        }

        case "site_scanning":
          setState((s) => ({ ...s, siteMessage: event.message }));
          break;

        case "complete":
          setState((s) => ({ ...s, done: true, report: event.report }));
          es.close();
          break;
      }
    };

    es.onerror = () => es.close();
    return () => es.close();
  }, [sessionId]);

  return state;
}
