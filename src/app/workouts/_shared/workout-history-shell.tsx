import type { ReactNode } from "react";

import { AppTopBar } from "@/app/_shared/app-top-bar";

import {
  WorkoutHistoryNavigation,
  type WorkoutHistoryView,
} from "./workout-history-navigation";

interface WorkoutHistoryShellProps {
  activeView: WorkoutHistoryView;
  userEmail: string | null | undefined;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function WorkoutHistoryShell({
  activeView,
  userEmail,
  eyebrow,
  title,
  description,
  children,
}: WorkoutHistoryShellProps) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-5 sm:py-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AppTopBar activeSection="history" userEmail={userEmail} />
        <WorkoutHistoryNavigation activeView={activeView} />

        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-950">{title}</h1>
          <p className="mt-3 max-w-2xl text-base text-gray-600">
            {description}
          </p>
        </header>

        {children}
      </section>
    </main>
  );
}
