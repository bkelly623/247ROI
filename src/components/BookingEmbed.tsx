import Link from "next/link";
import { cn } from "@/lib/utils";

const IFRAME_SRC = "https://api.leadconnectorhq.com/widget/booking/deaNfs7Dq6XtD6FzYMR8";
const IFRAME_ID = "deaNfs7Dq6XtD6FzYMR8_1775089987086";

type BookingEmbedProps = {
  iframeClassName?: string;
  wrapperClassName?: string;
  /**
   * default: tall min-heights for standalone blocks.
   * modal | page: fill parent flex area; iframe scrolls for long GHL steps.
   */
  variant?: "default" | "modal" | "page";
};

export function BookingIframe({
  iframeClassName,
  wrapperClassName,
  variant = "default",
}: BookingEmbedProps) {
  const isFill = variant === "modal" || variant === "page";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card overflow-hidden shadow-[0_12px_40px_-24px_rgba(0,0,0,0.4)]",
        isFill && "relative h-full min-h-0 w-full flex-1",
        wrapperClassName,
      )}
    >
      <iframe
        src={IFRAME_SRC}
        id={IFRAME_ID}
        className={cn(
          isFill
            ? "absolute inset-0 block h-full w-full min-h-0 border-0"
            : "block w-full min-h-[720px] md:min-h-[820px] lg:min-h-[900px] border-0 overflow-hidden",
          iframeClassName,
        )}
        style={
          isFill
            ? { width: "100%", height: "100%", border: "none" }
            : { width: "100%", border: "none", overflow: "hidden" }
        }
        scrolling={isFill ? "yes" : "no"}
        title="Schedule time with 247ROI"
      />
    </div>
  );
}

export function BookingSmsDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-[12px] text-muted-foreground text-center tracking-tight max-w-2xl mx-auto leading-relaxed",
        className,
      )}
    >
      By submitting this form, you agree to receive SMS messages from 247ROI related to your inquiry,
      including appointment reminders and service updates. Message frequency varies. Message &amp; data rates
      may apply. Reply STOP to opt out or HELP for help. See{" "}
      <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
        Privacy Policy
      </Link>{" "}
      and{" "}
      <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-foreground">
        Terms of Service
      </Link>
      .
    </p>
  );
}
