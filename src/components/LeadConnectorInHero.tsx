"use client";

import { useEffect } from "react";

const SLOT_ID = "gcl-launcher-slot";
const VOICE_ROOT_ID = "voice-demo";

function isSiteChatSubtree(el: Element) {
  return Boolean(el.closest("[data-247roi-site-chat='true']"));
}

function looksLikeGhlLauncher(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (isSiteChatSubtree(el)) return false;
  if (el.closest(`#${VOICE_ROOT_ID}`)) return false;

  const cls = typeof el.className === "string" ? el.className : "";
  const id = el.id || "";
  const blob = `${cls} ${id}`.toLowerCase();

  if (/lcw|leadconnector|chat-widget|msgsndr|highlevel|gohighlevel/.test(blob)) return true;

  const ifr = el.querySelector("iframe");
  if (ifr instanceof HTMLIFrameElement) {
    const src = (ifr.src || "").toLowerCase();
    if (src.includes("leadconnector") || src.includes("chat-widget") || src.includes("msgsndr")) return true;
  }

  const st = window.getComputedStyle(el);
  if (st.position === "fixed") {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.width < 520 && rect.height < 640) {
      const nearCorner = rect.bottom > window.innerHeight * 0.5 && rect.right > window.innerWidth * 0.35;
      if (nearCorner && el.querySelector("iframe, button")) return true;
    }
  }

  return false;
}

/**
 * LeadConnector injects a fixed bottom-right launcher. Move that root into `#gcl-launcher-slot`
 * inside the hero voice card so it reads as part of the demo, not “floating by the footer.”
 */
export default function LeadConnectorInHero() {
  useEffect(() => {
    const slot = document.getElementById(SLOT_ID);
    if (!slot) return;

    const tryRelocate = () => {
      if (slot.childElementCount > 0) return;

      const candidates: HTMLElement[] = [];

      for (const child of Array.from(document.body.children)) {
        if (!(child instanceof HTMLElement)) continue;
        if (isSiteChatSubtree(child)) continue;
        if (child.contains(slot)) continue;
        if (looksLikeGhlLauncher(child)) candidates.push(child);
      }

      if (candidates.length === 0) {
        const iframes = document.querySelectorAll<HTMLIFrameElement>(
          "iframe[src*='leadconnectorhq'], iframe[src*='chat-widget'], iframe[src*='msgsndr']",
        );
        for (const iframe of iframes) {
          if (isSiteChatSubtree(iframe)) continue;
          let p: HTMLElement | null = iframe.parentElement;
          for (let depth = 0; depth < 12 && p; depth++) {
            if (p === document.body) break;
            if (p.closest(`#${VOICE_ROOT_ID}`)) break;
            if (looksLikeGhlLauncher(p)) {
              candidates.push(p);
              break;
            }
            p = p.parentElement;
          }
        }
      }

      for (const node of candidates) {
        if (slot.contains(node)) continue;
        try {
          slot.appendChild(node);
          node.style.setProperty("position", "relative", "important");
          node.style.setProperty("inset", "auto", "important");
          node.style.setProperty("bottom", "auto", "important");
          node.style.setProperty("right", "auto", "important");
          node.style.setProperty("left", "auto", "important");
          node.style.setProperty("top", "auto", "important");
          node.style.margin = "0 auto";
        } catch {
          /* ignore */
        }
      }
    };

    tryRelocate();
    const obs = new MutationObserver(() => tryRelocate());
    obs.observe(document.body, { childList: true, subtree: true });
    const t = window.setInterval(tryRelocate, 500);
    const t2 = window.setTimeout(() => window.clearInterval(t), 25000);

    return () => {
      obs.disconnect();
      window.clearInterval(t);
      window.clearTimeout(t2);
    };
  }, []);

  return null;
}
