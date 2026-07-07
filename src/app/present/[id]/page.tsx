import { PresentView } from "@/components/audit/PresentView";

export default async function PresentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PresentView sessionId={id} />;
}
