import type { WorkoutTemplate, WorkoutTemplateRow } from "./types";

export function mapWorkoutTemplateRowToWorkoutTemplate(
  row: WorkoutTemplateRow,
): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
