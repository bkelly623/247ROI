"use client";

import { forwardRef } from "react";
import { DEMO_PHONE_HREF } from "@/app/components/cta";
import { requestOpenChat } from "@/lib/openChat";

const MD_BREAKPOINT = 768;

export type TestDriveLinkProps = React.ComponentPropsWithoutRef<"a">;

/** Desktop (md+): opens site chat. Mobile: native dial to demo line. */
export const TestDriveLink = forwardRef<HTMLAnchorElement, TestDriveLinkProps>(function TestDriveLink(
  { href = DEMO_PHONE_HREF, onClick, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      href={href}
      onClick={(e) => {
        if (typeof window !== "undefined" && window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`).matches) {
          e.preventDefault();
          requestOpenChat();
        }
        onClick?.(e);
      }}
      {...rest}
    />
  );
});
