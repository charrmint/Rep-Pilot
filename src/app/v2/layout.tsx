import type { ReactNode } from "react";
import { getV2Context } from "@/v2/server/context";
import { AppShell } from "@/v2/shell/app-shell";
import "@/v2/styles.css";

export default async function V2Layout({ children }: { children: ReactNode }) {
  const { user, activeWorkout, activeWorkoutUnavailable } = await getV2Context();
  return (
    <AppShell
      email={user?.email ?? null}
      signedIn={Boolean(user)}
      activeWorkout={activeWorkout}
      activeWorkoutUnavailable={activeWorkoutUnavailable}
    >
      {children}
    </AppShell>
  );
}
