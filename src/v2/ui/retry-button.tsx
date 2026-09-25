"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./primitives";

export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Checking…" : "Try again"}
    </Button>
  );
}
