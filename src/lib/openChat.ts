/** Hash used when opening chat from CTAs (shareable / deep link). */
export const CHAT_HASH = "chat";

const EVENT = "247roi:open-chat";

export function requestOpenChat() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT));
  const path = `${window.location.pathname}${window.location.search}`;
  if (window.location.hash !== `#${CHAT_HASH}`) {
    window.history.replaceState(null, "", `${path}#${CHAT_HASH}`);
  }
}

export function subscribeOpenChat(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function chatHashIsOpen() {
  if (typeof window === "undefined") return false;
  return window.location.hash === `#${CHAT_HASH}`;
}

export function clearChatHash() {
  if (typeof window === "undefined") return;
  if (window.location.hash === `#${CHAT_HASH}`) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
}
