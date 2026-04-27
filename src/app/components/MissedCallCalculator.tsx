"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AI_RECEPTIONIST_CTA_PHONE_HREF,
  BOOK_SETUP_CALL_LINK_CLASSNAME,
} from "@/app/components/cta";

const MIN_AVG = 50;
const MAX_AVG = 10000;

type BusinessId =
  | "roofing"
  | "hvac"
  | "plumbing"
  | "salon"
  | "dental"
  | "other";

type PeriodId = "daily" | "weekly" | "monthly" | "annually";

const PERIODS: { id: PeriodId; label: string; days: number }[] = [
  { id: "daily", label: "Daily", days: 1 },
  { id: "weekly", label: "Weekly", days: 7 },
  { id: "monthly", label: "Monthly", days: 30 },
  { id: "annually", label: "Annually", days: 365 },
];

const BUSINESSES: Record<
  BusinessId,
  { label: string; missed: number; conversion: number; avg: number }
> = {
  roofing: { label: "Roofing", missed: 7, conversion: 30, avg: 8500 },
  hvac: { label: "HVAC", missed: 8, conversion: 35, avg: 1400 },
  plumbing: { label: "Plumbing", missed: 7, conversion: 40, avg: 650 },
  salon: { label: "Salon", missed: 10, conversion: 60, avg: 120 },
  dental: { label: "Dental", missed: 5, conversion: 50, avg: 600 },
  other: { label: "Other", missed: 6, conversion: 35, avg: 700 },
};

function avgToLinear(avg: number): number {
  const clamped = Math.min(MAX_AVG, Math.max(MIN_AVG, avg));
  return (100 * Math.log(clamped / MIN_AVG)) / Math.log(MAX_AVG / MIN_AVG);
}

function linearToAvg(linear: number): number {
  const t = Math.min(100, Math.max(0, linear)) / 100;
  return Math.round(MIN_AVG * Math.pow(MAX_AVG / MIN_AVG, t));
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function useAnimatedNumber(target: number, durationMs: number): number {
  const [value, setValue] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = displayRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const e = easeOutCubic(t);
      const next = from + (target - from) * e;
      displayRef.current = next;
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return value;
}

const rangeClass =
  "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary transition-[opacity,transform] duration-150 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary";

type MissedCallCalculatorProps = {
  /** Standalone `/missed-call-calculator` page shows the classic H1. */
  showHeading?: boolean;
  /** When true (e.g. homepage free audit), cycles industry presets while idle — pauses after interaction. */
  enableIdleDemo?: boolean;
};

export default function MissedCallCalculator({
  showHeading = true,
  enableIdleDemo = false,
}: MissedCallCalculatorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const businessRef = useRef<BusinessId>("roofing");
  const lastUserInteractionRef = useRef(0);
  const userTouchedRef = useRef(false);
  const visibleRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectBusinessFnRef = useRef<(id: BusinessId) => void>(() => {});

  const [business, setBusiness] = useState<BusinessId>("roofing");
  const [missedCalls, setMissedCalls] = useState(BUSINESSES.roofing.missed);
  const [conversion, setConversion] = useState(BUSINESSES.roofing.conversion);
  const [avgValue, setAvgValue] = useState(BUSINESSES.roofing.avg);
  const [period, setPeriod] = useState<PeriodId>("monthly");

  const presetRafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (presetRafRef.current != null) {
        cancelAnimationFrame(presetRafRef.current);
      }
    };
  }, []);

  const selectBusiness = (id: BusinessId) => {
    setBusiness(id);
    const p = BUSINESSES[id];

    if (presetRafRef.current != null) {
      cancelAnimationFrame(presetRafRef.current);
      presetRafRef.current = null;
    }

    const startMissed = missedCalls;
    const startConv = conversion;
    const startAvg = avgValue;
    const duration = 550;
    const t0 = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = easeOutCubic(t);
      setMissedCalls(Math.round(startMissed + (p.missed - startMissed) * e));
      setConversion(Math.round(startConv + (p.conversion - startConv) * e));
      setAvgValue(Math.round(startAvg + (p.avg - startAvg) * e));
      if (t < 1) {
        presetRafRef.current = requestAnimationFrame(step);
      } else {
        setMissedCalls(p.missed);
        setConversion(p.conversion);
        setAvgValue(p.avg);
        presetRafRef.current = null;
      }
    };
    presetRafRef.current = requestAnimationFrame(step);
  };

  selectBusinessFnRef.current = selectBusiness;
  businessRef.current = business;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !enableIdleDemo) return;

    const markUser = () => {
      userTouchedRef.current = true;
      lastUserInteractionRef.current = Date.now();
    };

    el.addEventListener("pointerdown", markUser, true);
    el.addEventListener("keydown", markUser, true);
    return () => {
      el.removeEventListener("pointerdown", markUser, true);
      el.removeEventListener("keydown", markUser, true);
    };
  }, [enableIdleDemo]);

  useEffect(() => {
    if (!enableIdleDemo) return;

    const el = rootRef.current;
    if (!el) return;

    const clearIdleTimer = () => {
      if (idleTimerRef.current != null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const scheduleIdleTick = () => {
      clearIdleTimer();
      const delayMs = 9000 + Math.random() * 12000;
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        if (!visibleRef.current) {
          return;
        }
        if (typeof document !== "undefined" && document.hidden) {
          return;
        }
        if (
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          return;
        }

        const now = Date.now();
        const idleNeededMs = userTouchedRef.current ? 60_000 : 12_000;
        if (now - lastUserInteractionRef.current < idleNeededMs) {
          scheduleIdleTick();
          return;
        }

        const cur = businessRef.current;
        const ids = (Object.keys(BUSINESSES) as BusinessId[]).filter((id) => id !== cur);
        if (ids.length > 0) {
          const pick = ids[Math.floor(Math.random() * ids.length)]!;
          selectBusinessFnRef.current(pick);
        }
        scheduleIdleTick();
      }, delayMs);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.12);
        visibleRef.current = visible;
        if (visible) {
          scheduleIdleTick();
        } else {
          clearIdleTimer();
        }
      },
      { threshold: [0, 0.12, 0.2, 0.35] },
    );

    io.observe(el);

    const onVisibility = () => {
      if (typeof document !== "undefined" && document.hidden) {
        clearIdleTimer();
      } else if (visibleRef.current) {
        scheduleIdleTick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearIdleTimer();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enableIdleDemo]);

  const periodDays = useMemo(
    () => PERIODS.find((p) => p.id === period)?.days ?? 30,
    [period],
  );

  const dailyLoss = missedCalls * (conversion / 100) * avgValue;
  const totalLost = dailyLoss * periodDays;
  const xCount = Math.round(missedCalls * (conversion / 100) * periodDays);

  const animatedTotal = useAnimatedNumber(totalLost, 600);
  const avgLinear = avgToLinear(avgValue);

  const pillBase =
    "rounded-full px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap shrink-0 border transition-all duration-200 ease-out active:scale-[0.98]";
  const pillInactive =
    "border-border bg-muted/40 text-foreground hover:border-primary/35 hover:bg-muted/70";
  const pillActive =
    "border-transparent bg-primary text-primary-foreground shadow-[0_0_22px_hsl(174_72%_56%/0.25)]";

  const sliderLabel = "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";
  const sliderValue = "text-[13px] font-bold tabular-nums tracking-tight text-primary";

  return (
    <div ref={rootRef} className="w-full font-sans text-foreground antialiased">
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center px-1 py-2 sm:px-2">
        {showHeading ? (
          <h1 className="mb-6 text-center font-display text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
            How Much Revenue Are You Losing?
          </h1>
        ) : null}

        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex w-full flex-wrap justify-center gap-1.5">
            {(Object.keys(BUSINESSES) as BusinessId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => selectBusiness(id)}
                className={`${pillBase} ${business === id ? pillActive : pillInactive}`}
              >
                {BUSINESSES[id].label}
              </button>
            ))}
          </div>

          <div className="w-full space-y-3">
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="missed-calls" className={sliderLabel}>
                  Missed / day
                </label>
                <span className={sliderValue}>{missedCalls}</span>
              </div>
              <input
                id="missed-calls"
                type="range"
                min={1}
                max={50}
                value={missedCalls}
                onChange={(e) => setMissedCalls(Number(e.target.value))}
                className={rangeClass}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="conversion" className={sliderLabel}>
                  Close rate
                </label>
                <span className={sliderValue}>{conversion}%</span>
              </div>
              <input
                id="conversion"
                type="range"
                min={5}
                max={80}
                value={conversion}
                onChange={(e) => setConversion(Number(e.target.value))}
                className={rangeClass}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="avg-value" className={sliderLabel}>
                  Avg job value
                </label>
                <span className={sliderValue}>{formatMoney(avgValue)}</span>
              </div>
              <input
                id="avg-value"
                type="range"
                min={0}
                max={100}
                step={0.25}
                value={avgLinear}
                onChange={(e) => setAvgValue(linearToAvg(Number(e.target.value)))}
                className={rangeClass}
              />
            </div>
          </div>

          <div className="flex w-full flex-wrap justify-center gap-1.5 pt-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`${pillBase} ${period === p.id ? pillActive : pillInactive}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <section className="w-full pt-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              You&apos;re Losing
            </p>
            <p className="missed-calc-result-pulse mt-1.5 text-[3rem] font-display font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[4.25rem] gradient-text drop-shadow-[0_0_28px_hsl(174_72%_56%/0.35)]">
              {formatMoney(animatedTotal)}
            </p>
            <p className="mt-2 max-w-[28ch] text-[13px] font-semibold leading-snug text-foreground/90 mx-auto">
              That&apos;s {xCount} customers you never even spoke to
            </p>

            <div className="mt-5 flex flex-col items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 sm:px-10 min-h-[3.25rem] text-sm sm:text-base font-semibold shadow-[0_0_32px_hsl(174_72%_56%/0.22)] touch-manipulation"
              >
                <a href={AI_RECEPTIONIST_CTA_PHONE_HREF}>Call Our AI Receptionist Now</a>
              </Button>
              <Link
                href="/#book-call"
                className={`${BOOK_SETUP_CALL_LINK_CLASSNAME} text-xs sm:text-sm text-center`}
              >
                Or book a 10-minute setup call
              </Link>
            </div>
          </section>

          <p className="mt-auto pt-6 text-center text-[11px] font-medium tracking-tight text-muted-foreground">
            247ROI
          </p>
        </div>
      </div>
    </div>
  );
}
