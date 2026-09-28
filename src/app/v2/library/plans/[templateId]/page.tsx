import { PlanScreen } from "@/v2/plans/plan-screen";
export default async function Page({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  return <PlanScreen templateId={templateId} />;
}
