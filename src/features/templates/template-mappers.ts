import type {
  WorkoutTemplate,
  WorkoutTemplateDetails,
  WorkoutTemplateExercise,
  WorkoutTemplateExerciseRowWithExercise,
  WorkoutTemplateRow,
} from "./types";

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

export function mapWorkoutTemplateRowToWorkoutTemplateDetails(
  row: WorkoutTemplateRow,
  exercises: WorkoutTemplateExercise[],
): WorkoutTemplateDetails {
  return {
    ...mapWorkoutTemplateRowToWorkoutTemplate(row),
    exercises,
  };
}

export function mapWorkoutTemplateExerciseRowToWorkoutTemplateExercise(
  row: WorkoutTemplateExerciseRowWithExercise,
): WorkoutTemplateExercise {
  if (!row.exercise) {
    throw new Error("Template exercise is missing exercise details.");
  }

  return {
    id: row.id,
    templateId: row.template_id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise.name,
    exerciseIsArchived: row.exercise.is_archived,
    exerciseIsSystemExercise: row.exercise.user_id === null,
    position: row.position,
    config: {
      targetSets: row.target_sets,
      minReps: row.min_reps,
      maxReps: row.max_reps,
      defaultWeightValue: row.default_weight_value,
      defaultWeightUnit: row.default_weight_unit,
      defaultNormalizedWeightLbs: row.default_normalized_weight_lbs,
      weightIncrementLbs: row.weight_increment_lbs,
    },
  };
}
