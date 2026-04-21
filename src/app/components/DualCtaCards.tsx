import {
  CTA_MICRO,
  DEMO_CARD_BUTTON_LABEL,
  DEMO_PHONE_DISPLAY,
  DEMO_PHONE_HREF,
  DEMO_SUBTEXT,
  HERO_PRIMARY_CTA_LABEL,
  PRIMARY_PHONE_DISPLAY,
  PRIMARY_PHONE_HREF,
} from "./cta";

type DualCtaCardsProps = {
  className?: string;
  variant?: "default" | "onBlue";
};

export default function DualCtaCards({
  className = "",
  variant = "default",
}: DualCtaCardsProps) {
  const onBlue = variant === "onBlue";

  const cardBase = onBlue
    ? "rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-md shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)] p-7 sm:p-9 text-center flex flex-col items-center transition duration-300 hover:bg-white/[0.12] hover:border-white/30"
    : "rounded-2xl border border-gray-200/90 bg-white shadow-[0_12px_40px_-20px_rgba(15,23,42,0.12)] p-7 sm:p-9 text-center flex flex-col items-center transition duration-300 hover:shadow-[0_20px_50px_-24px_rgba(5,150,105,0.15)] hover:-translate-y-0.5";

  const primaryBtn = onBlue
    ? "inline-flex items-center justify-center bg-white text-slate-900 px-8 py-4 rounded-full hover:bg-gray-50 transition-all text-[15px] font-semibold tracking-tight w-full shadow-lg"
    : "inline-flex items-center justify-center bg-emerald-600 text-white px-8 py-4 rounded-full hover:bg-emerald-700 transition-all text-[15px] font-semibold tracking-tight w-full shadow-[0_4px_14px_rgba(5,150,105,0.35)]";

  const demoBtn = onBlue
    ? "inline-flex items-center justify-center border-2 border-white/85 text-white px-8 py-3.5 rounded-full hover:bg-white/10 transition-all text-[15px] font-semibold tracking-tight w-full"
    : "inline-flex items-center justify-center border-2 border-emerald-200 text-emerald-700 bg-white px-8 py-3.5 rounded-full hover:bg-emerald-50/80 transition-all text-[15px] font-semibold tracking-tight w-full";

  const microCls = onBlue
    ? "text-[11px] text-white/80 hover:text-white tracking-tight mt-2 underline underline-offset-2"
    : "text-[11px] text-gray-500 hover:text-gray-700 tracking-tight mt-2 underline underline-offset-2";

  const demoSubCls = onBlue
    ? "text-[12px] text-white/75 tracking-tight mt-2 leading-snug"
    : "text-[12px] text-gray-500 tracking-tight mt-2 leading-snug";

  const phoneLine = onBlue ? "text-[13px] font-medium text-white/90 mt-3" : "text-[13px] font-medium text-gray-800 mt-3";

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full max-w-[920px] mx-auto ${className}`}
    >
      <div className={cardBase}>
        <p
          className={`text-[12px] font-semibold uppercase tracking-[0.14em] mb-4 ${onBlue ? "text-white/70" : "text-emerald-600"}`}
        >
          Your business line
        </p>
        <a href={PRIMARY_PHONE_HREF} className={primaryBtn}>
          {HERO_PRIMARY_CTA_LABEL}
        </a>
        <p className={phoneLine}>{PRIMARY_PHONE_DISPLAY}</p>
        <a href="/guarantee" className={microCls}>
          {CTA_MICRO}
        </a>
      </div>
      <div className={cardBase}>
        <p
          className={`text-[12px] font-semibold uppercase tracking-[0.14em] mb-4 ${onBlue ? "text-white/70" : "text-emerald-600"}`}
        >
          Live voice demo
        </p>
        <a href={DEMO_PHONE_HREF} className={demoBtn}>
          {DEMO_CARD_BUTTON_LABEL}
        </a>
        <p className={phoneLine}>{DEMO_PHONE_DISPLAY}</p>
        <p className={demoSubCls}>{DEMO_SUBTEXT}</p>
      </div>
    </div>
  );
}
