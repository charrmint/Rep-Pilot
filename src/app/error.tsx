"use client";

import { PublicShell } from "@/v2/public/public-shell";
import { Button, ButtonLink, Card } from "@/v2/ui/primitives";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <PublicShell narrow><Card className="v2-public-stack">
    <h1>Something didn’t load.</h1>
    <p role="alert">We couldn’t load this page. Please try again.</p>
    <Button onClick={reset}>Try again</Button>
    <ButtonLink variant="secondary" href="/">Back to home</ButtonLink>
  </Card></PublicShell>;
}
