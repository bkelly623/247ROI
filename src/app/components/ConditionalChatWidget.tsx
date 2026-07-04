"use client";

import { usePathname } from "next/navigation";
import ChatWidget from "@/app/components/ChatWidget";

const HIDE_CHAT_PREFIXES = ["/audit", "/report"];

export default function ConditionalChatWidget() {
  const pathname = usePathname() ?? "";
  const hide = HIDE_CHAT_PREFIXES.some((p) => pathname.startsWith(p));
  if (hide) return null;
  return <ChatWidget />;
}
