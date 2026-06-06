/** Public-path brand mark (horizontal logo). File: `public/site-logo.png`. */
export const SITE_LOGO_PATH = "/site-logo.png";

export const SITE_LOGO_ALT = "247ROI";

/** Intrinsic ratio for Next/Image. */
export const SITE_LOGO_INTRINSIC = { width: 738, height: 240 } as const;

/** Nav: prominent, legible brand mark. */
export const siteLogoNavImageClassName =
  "h-10 w-auto max-h-[48px] max-w-[min(250px,58vw)] object-contain object-left sm:h-12 sm:max-h-[56px] sm:max-w-[min(320px,46vw)] lg:h-14 lg:max-h-[64px] lg:max-w-[min(420px,26vw)]";

/** Footer: largest in-app mark — full wordmark legible above columns. */
export const siteLogoFooterImageClassName =
  "h-20 w-auto max-h-[96px] max-w-[min(680px,92vw)] object-contain object-left sm:h-24 sm:max-h-[120px] sm:max-w-[min(820px,88vw)]";
