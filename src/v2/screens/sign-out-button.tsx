"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/features/auth/auth-client-service";
import { Button } from "../ui/primitives";

export function SignOutButton() {
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function _signOut() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      await signOut();
      router.replace("/v2");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <div className="v2-sign-out-control">
      <Button
        variant="secondary"
        disabled={pending}
        aria-busy={pending}
        onClick={_signOut}
      >
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
