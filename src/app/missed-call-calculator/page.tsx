import type { Metadata } from "next";
import MissedCallCalculator from "../components/MissedCallCalculator";

export const metadata: Metadata = {
  title: "Missed Call Calculator | 247ROI",
  description:
    "Estimate revenue lost from missed calls with a quick calculator for local businesses.",
};

export default function MissedCallCalculatorPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans antialiased py-12 px-4">
      <MissedCallCalculator showHeading />
    </main>
  );
}
