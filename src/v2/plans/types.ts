import type { WorkoutTemplate } from "@/features/templates/types";

export type PlanNameResult =
  | { status: "success"; plan: Pick<WorkoutTemplate, "id" | "name"> }
  | { status: "error"; message: string };

export interface PlanNameFormProps {
  plan?: Pick<WorkoutTemplate, "id" | "name">;
}
