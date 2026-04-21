import {
  CTA_LABEL_NAV,
  CTA_MICRO,
  DEMO_CTA_LABEL,
  DEMO_PHONE_HREF,
  DEMO_SUBTEXT,
  HERO_PRIMARY_CTA_LABEL,
  PRIMARY_PHONE_HREF,
} from "./cta";

type NavCtaPairProps = {
  className?: string;
  compact?: boolean;
  showDemo?: boolean;
  showGuarantee?: boolean;
  /** Use nav label (Call Us Now) instead of hero label on primary button. */
  primaryLabel?: "nav" | "hero";
  /** Dark glass surfaces (e.g. chat widget) — matches site tokens. */
  surface?: "light" | "dark";
};

export default function NavCtaPair({
  className = "",
  compact = false,
  showDemo = false,
  showGuarantee = false,
  primaryLabel = "nav",
  surface = "light",
}: NavCtaPairProps) {
  const gap = compact ? "gap-2" : "gap-3";
  const btnPrimaryLight = compact
    ? "px-4 py-2.5 text-[12px] sm:px-5 sm:py-3 sm:text-[13px] font-semibold shadow-[0_2px_12px_rgba(5,150,105,0.25)] hover:shadow-[0_4px_16px_rgba(5,150,105,0.32)]"
    : "px-6 py-3 text-[14px] sm:text-[15px] font-semibold shadow-[0_2px_12px_rgba(5,150,105,0.25)] hover:shadow-[0_4px_16px_rgba(5,150,105,0.32)]";
  const btnPrimaryDark = compact
    ? "px-4 py-2.5 text-[12px] sm:px-5 sm:py-3 sm:text-[13px] font-semibold shadow-[0_0_24px_hsl(174_72%_56%/0.35)] hover:shadow-[0_0_32px_hsl(174_72%_56%/0.45)]"
    : "px-6 py-3 text-[14px] sm:text-[15px] font-semibold shadow-[0_0_24px_hsl(174_72%_56%/0.35)] hover:shadow-[0_0_32px_hsl(174_72%_56%/0.45)]";
  const btnPrimary = surface === "dark" ? btnPrimaryDark : btnPrimaryLight;
  const btnDemo = compact
    ? "px-2.5 py-2 text-[11px] sm:px-3 sm:py-2 sm:text-[12px]"
    : "px-4 py-2.5 text-[13px] sm:text-[14px]";

  const primaryText = primaryLabel === "nav" ? CTA_LABEL_NAV : HERO_PRIMARY_CTA_LABEL;
  const primaryClasses =
    surface === "dark"
      ? `inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 tracking-tight whitespace-nowrap ${btnPrimary}`
      : `inline-flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 tracking-tight whitespace-nowrap ${btnPrimary}`;
  const demoClasses =
    surface === "dark"
      ? `inline-flex items-center justify-center rounded-full border border-primary/35 bg-white/[0.06] text-foreground hover:bg-white/[0.1] hover:border-primary/50 transition-all duration-200 tracking-tight font-semibold whitespace-nowrap ${btnDemo}`
      : `inline-flex items-center justify-center rounded-full border-2 border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition-all duration-200 tracking-tight font-semibold whitespace-nowrap ${btnDemo}`;
  const microClass =
    surface === "dark"
      ? "text-[9px] sm:text-[10px] text-muted-foreground hover:text-foreground tracking-tight mt-1 underline underline-offset-2 max-w-[200px] leading-tight"
      : "text-[9px] sm:text-[10px] text-gray-500 hover:text-gray-700 tracking-tight mt-1 underline underline-offset-2 max-w-[200px] leading-tight";
  const demoSubClass =
    surface === "dark"
      ? "text-[9px] sm:text-[10px] text-muted-foreground tracking-tight mt-1 max-w-[9.5rem] sm:max-w-[11rem] leading-tight"
      : "text-[9px] sm:text-[10px] text-gray-500 tracking-tight mt-1 max-w-[9.5rem] sm:max-w-[11rem] leading-tight";

  return (
    <div
      className={`flex flex-row flex-nowrap items-start justify-center sm:justify-end ${gap} ${className}`}
    >
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 shrink">
        <a href={PRIMARY_PHONE_HREF} className={primaryClasses}>
          {primaryText}
        </a>
        {showGuarantee ? (
          <a href="/guarantee" className={microClass}>
            {CTA_MICRO}
          </a>
        ) : null}
      </div>
      {showDemo ? (
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 shrink">
          <a href={DEMO_PHONE_HREF} className={demoClasses}>
            {DEMO_CTA_LABEL}
          </a>
          <p className={demoSubClass}>{DEMO_SUBTEXT}</p>
        </div>
      ) : null}
    </div>
  );
}
