import { ButtonLink, Card } from "@/v2/ui/primitives";
export default function NotFound() {
  return <Card><h1>History unavailable</h1><p>This item is unavailable or does not belong to your account.</p><ButtonLink href="/v2/history">Back to History</ButtonLink></Card>;
}
