/** Public-path brand mark (horizontal logo). File: `public/site-logo.png`. */
export const SITE_LOGO_PATH = "/site-logo.png";

export const SITE_LOGO_ALT = "247ROI";

/** Intrinsic ratio for Next/Image. */
export const SITE_LOGO_INTRINSIC = { width: 1100, height: 650 } as const;

/** Nav: prominent, legible brand mark. */
export const siteLogoNavImageClassName =
  "h-16 w-auto max-h-[72px] max-w-[min(170px,46vw)] object-contain object-left sm:h-20 sm:max-h-[88px] sm:max-w-[min(210px,36vw)] lg:h-20 lg:max-h-[88px] lg:max-w-[min(230px,18vw)]";

/** Footer: largest in-app mark — full wordmark legible above columns. */
export const siteLogoFooterImageClassName =
  "h-32 w-auto max-h-[150px] max-w-[min(360px,92vw)] object-contain object-left sm:h-40 sm:max-h-[190px] sm:max-w-[min(420px,88vw)]";
