import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-3xl font-semibold">RepPilot</h1>
      <p className="mt-3 max-w-xl text-lg text-gray-600">
        Log the workout. Know what to do next.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/templates"
          className="rounded-md bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Open templates
        </Link>
        <Link
          href="/exercises"
          className="rounded-md border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-950"
        >
          Exercise library
        </Link>
      </div>
    </main>
  );
}
