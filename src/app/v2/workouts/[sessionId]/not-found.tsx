import { ButtonLink, Card } from "@/v2/ui/primitives";

export default function NotFound() {
  return <Card><h1>Workout unavailable</h1><p>This workout is unavailable or does not belong to your account.</p><ButtonLink href="/v2">Back to Today</ButtonLink></Card>;
}
