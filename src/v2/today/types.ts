import type { WorkoutTemplateLibrary } from "@/features/templates/types";
import type { V2Context } from "../server/types";

export type TodayPlansResult =
  | { status: "ready"; library: WorkoutTemplateLibrary }
  | { status: "unavailable" };

export interface NextWorkoutProps {
  plans: Promise<TodayPlansResult>;
}

export interface TodayPlansProps extends NextWorkoutProps {
  activeWorkout: V2Context["activeWorkout"];
  activeWorkoutUnavailable: boolean;
}

export interface ActiveProgressProps {
  userId: string;
  sessionId: string;
}
