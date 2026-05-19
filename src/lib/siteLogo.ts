/** Public-path brand mark (horizontal logo). File: `public/site-logo.png`. */
export const SITE_LOGO_PATH = "/site-logo.png";

export const SITE_LOGO_ALT = "247ROI";

/** Intrinsic ratio for Next/Image. */
export const SITE_LOGO_INTRINSIC = { width: 520, height: 160 } as const;

/** Nav: larger, more legible brand mark. */
export const siteLogoNavImageClassName =
  "h-14 w-auto max-h-[64px] max-w-[min(420px,70vw)] object-contain object-left sm:h-16 sm:max-h-[72px] sm:max-w-[min(520px,62vw)] lg:max-w-[min(560px,34vw)]";

/** Footer: largest in-app mark — full wordmark legible above columns. */
export const siteLogoFooterImageClassName =
  "h-16 w-auto max-h-[72px] max-w-[min(520px,92vw)] object-contain object-left sm:h-20 sm:max-h-[88px] sm:max-w-[min(680px,88vw)]";
