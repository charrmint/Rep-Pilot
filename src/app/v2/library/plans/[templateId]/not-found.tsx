import { ButtonLink, Card } from "@/v2/ui/primitives";
export default function NotFound() {
  return <Card className="v2-empty"><h1>Plan not found.</h1><p>This plan is no longer available in your account.</p><ButtonLink href="/v2/library">Back to plans</ButtonLink></Card>;
}
