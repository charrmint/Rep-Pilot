import Link from "next/link";

import { DemoEntryForm } from "@/features/demo/demo-entry-form";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <section className="flex w-full max-w-xl flex-col items-center text-center">
        <h1 className="text-4xl font-semibold tracking-tight">RepPilot</h1>
        <p className="mt-3 text-lg text-gray-600">
          Log the workout. Know what to do next.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Explore a ready-to-use workout history. No account required.
        </p>
        <div className="mt-7 w-full max-w-xs">
          <DemoEntryForm />
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-gray-800 hover:text-gray-950"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
