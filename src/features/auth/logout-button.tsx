"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut } from "./auth-client-service";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function _handleSignOut() {
    setIsSigningOut(true);
    setErrorMessage(null);

    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage("Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={_handleSignOut}
        disabled={isSigningOut}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
      {errorMessage ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
