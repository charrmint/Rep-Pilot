import type { WorkoutTemplateExercise } from "@/features/templates/types";

interface TemplateExercisePreviewProps {
  exercises: WorkoutTemplateExercise[];
}

export function TemplateExercisePreview({
  exercises,
}: TemplateExercisePreviewProps) {
  if (exercises.length === 0) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
        No exercises added yet.
      </div>
    );
  }

  return (
    <ol className="mt-3 divide-y divide-gray-200 rounded-md border border-gray-200 bg-gray-50">
      {exercises.map((exercise) => (
        <li
          key={exercise.id}
          className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-950">
              {exercise.position}. {exercise.exerciseName}
            </p>
            {exercise.exerciseIsArchived ? (
              <p className="mt-1 text-xs font-medium text-amber-700">
                Archived exercise
              </p>
            ) : null}
          </div>
          <p className="text-sm text-gray-600">
            {_formatExerciseConfig(exercise)}
          </p>
        </li>
      ))}
    </ol>
  );
}

function _formatExerciseConfig(exercise: WorkoutTemplateExercise): string {
  return [
    `${exercise.config.targetSets} x ${exercise.config.minReps}-${exercise.config.maxReps}`,
    `@ ${exercise.config.defaultWeightValue} ${exercise.config.defaultWeightUnit}`,
    `+${exercise.config.weightIncrementLbs} lb`,
  ].join(" ");
}
