"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import HashBookingRedirect from "@/components/HashBookingRedirect";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <HashBookingRedirect />
      {children}
    </TooltipProvider>
  );
}
