import type { WorkoutTemplateLibrary } from "@/features/templates/types";

export function selectQuickStartPlans(library: WorkoutTemplateLibrary) {
  return library.activeTemplates
    .filter((plan) => !plan.isArchived && plan.exercises.length > 0)
    .sort((left, right) => {
      const byDate = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
      return byDate || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
    })
    .slice(0, 2);
}
