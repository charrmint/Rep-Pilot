"use client";

import { Button, Card } from "@/v2/ui/primitives";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Card className="v2-empty">
      <h1>Something didn’t load.</h1>
      <p role="alert">We couldn’t load this page. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </Card>
  );
}
