/** Public-path brand mark (horizontal logo). File: `public/site-logo.png`. */
export const SITE_LOGO_PATH = "/site-logo.png";

export const SITE_LOGO_ALT = "247ROI";

/** Intrinsic ratio for Next/Image (horizontal mark ~4:1). */
export const SITE_LOGO_INTRINSIC = { width: 480, height: 120 } as const;

/** Nav: primary brand read at arm’s length; capped so menu + logo fit on narrow phones. */
export const siteLogoNavImageClassName =
  "h-12 w-auto max-h-[52px] max-w-[min(320px,64vw)] object-contain object-left sm:h-[52px] sm:max-h-[56px] sm:max-w-[min(380px,50vw)] lg:max-w-[min(420px,28vw)]";

/** Footer: largest in-app mark — full wordmark legible above columns. */
export const siteLogoFooterImageClassName =
  "h-14 w-auto max-h-[58px] max-w-[min(380px,92vw)] object-contain object-left sm:h-16 sm:max-h-[64px] sm:max-w-[min(440px,88vw)]";

/** Hero voice card: matches footer scale inside the dark card. */
export const siteLogoHeroCardImageClassName =
  "h-14 w-auto max-h-[58px] max-w-[min(380px,96%)] object-contain sm:h-16 sm:max-h-[64px] sm:max-w-[min(440px,94%)]";

/** Calculator footer: clearly readable under results; still secondary to buttons. */
export const siteLogoCalculatorImageClassName =
  "h-11 w-auto max-h-[48px] max-w-[min(300px,90vw)] object-contain sm:h-12 sm:max-h-[52px] sm:max-w-[min(340px,86vw)]";
