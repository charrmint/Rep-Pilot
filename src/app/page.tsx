import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <section className="flex w-full max-w-xl flex-col items-center text-center">
        <h1 className="text-4xl font-semibold tracking-tight">RepPilot</h1>
        <p className="mt-3 text-lg text-gray-600">
          Log the workout. Know what to do next.
        </p>
        <Link
          href="/login"
          className="mt-7 rounded-md bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Get started
        </Link>
      </section>
    </main>
  );
}
