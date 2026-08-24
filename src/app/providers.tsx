"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import HashBookingRedirect from "@/components/HashBookingRedirect";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <HashBookingRedirect />
      <AnalyticsTracker />
      {children}
    </TooltipProvider>
  );
}
