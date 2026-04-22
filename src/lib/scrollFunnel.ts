/** Dispatched on `/` so `Hero` can scroll, spotlight, and pulse the voice card. */
export const VOICE_DEMO_FOCUS_EVENT = "247roi-focus-voice-demo";

export function isHomePathname(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

export function scrollBookCallIntoView(): void {
  if (typeof document === "undefined") return;
  document.getElementById("book-call")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** From any page: home scrolls in-page; other routes navigate to the homepage hash. */
export function requestVoiceDemoFocus(pathname: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const path = pathname ?? window.location.pathname;
  if (isHomePathname(path)) {
    window.dispatchEvent(new CustomEvent(VOICE_DEMO_FOCUS_EVENT));
  } else {
    window.location.assign("/#voice-demo");
  }
}

export function requestBookCallFocus(pathname: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const path = pathname ?? window.location.pathname;
  if (isHomePathname(path)) {
    scrollBookCallIntoView();
  } else {
    window.location.assign("/#book-call");
  }
}
