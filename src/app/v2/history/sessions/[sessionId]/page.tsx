import { SessionHistoryScreen } from "@/v2/history/history-screens";
export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  return <SessionHistoryScreen sessionId={(await params).sessionId} />;
}
