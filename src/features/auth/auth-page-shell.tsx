import Link from "next/link";

import type { AuthPageShellProps } from "./types";

export function AuthPageShell({
  title,
  description,
  children,
}: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header>
          <Link href="/" className="text-sm font-semibold text-gray-600">
            RepPilot
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-gray-950">{title}</h1>
          <p className="mt-3 text-base text-gray-600">{description}</p>
        </header>
        {children}
        <Link
          href="/login"
          className="min-h-11 py-3 text-center text-sm font-semibold text-gray-700 underline"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
