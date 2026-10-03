import type { Metadata } from "next";
import LeadOfferPage from "@/components/LeadOfferPage";
export const metadata: Metadata = {
 title: "Missed-Call Text Back for Your Business | 247ROI",
 description: "Turn eligible missed calls into text conversations. Give callers a prompt response and your team a clear next step. Explore 247ROI missed-call text back.",
 alternates: { canonical: "/missed-call-text-back" },
 openGraph: { title: "Missed-Call Text Back | 247ROI", description: "Miss the call. Not the chance to win the customer.", url: "/missed-call-text-back" },
};
export default function Page(){return <LeadOfferPage offer="missed-call-text-back" />;}
