import { unstable_rethrow } from "next/navigation";
import { listWorkoutTemplateLibrary } from "@/features/templates/template-service";
import type { TodayPlansResult } from "./types";

export async function loadTodayPlans(userId: string): Promise<TodayPlansResult> {
  try {
    return { status: "ready", library: await listWorkoutTemplateLibrary(userId) };
  } catch (error) {
    unstable_rethrow(error);
    return { status: "unavailable" };
  }
}
