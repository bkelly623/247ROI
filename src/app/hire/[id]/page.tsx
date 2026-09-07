import { permanentRedirect } from "next/navigation";

export default async function HireReportRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/ai-opportunity-audit/${id}`);
}
