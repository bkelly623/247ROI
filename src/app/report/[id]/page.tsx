import type { Metadata } from "next";
import { ReportView } from "@/components/audit/ReportView";

export const metadata: Metadata = {
  title: "Your Infrastructure Blueprint | 247ROI",
  robots: { index: false, follow: false },
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportView sessionId={id} />;
}
