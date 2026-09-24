"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/features/auth/auth-client-service";
import { Button } from "../ui/primitives";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function _signOut() {
    setPending(true);
    setError(null);
    try {
      await signOut();
      router.replace("/v2");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <Button variant="secondary" disabled={pending} onClick={_signOut}>
        {pending ? "Signing out…" : "Sign out"}
      </Button>
      {error && (
        <p className="v2-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
