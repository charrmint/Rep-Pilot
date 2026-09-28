import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { getLatestCompletedWorkout } from "@/features/workouts/workout-service";
import { getWorkoutDurationLabel } from "@/features/workouts/workout-history";
import { LocalDateTime } from "@/features/workouts/components/local-date-time";
import { RecommendationSummary } from "@/features/progression/components/recommendation-summary";
import { StrengthRecordSummary } from "@/features/records/components/strength-record-summary";
import { ButtonLink, Card } from "../ui/primitives";
import { RetryButton } from "../ui/retry-button";
import type {
  CompletedWorkoutInsightsProps,
  TodayInsightsProps,
} from "./types";

export async function TodayInsights({ userId }: TodayInsightsProps) {
  let workout;
  try {
    workout = await getLatestCompletedWorkout(userId);
  } catch (error) {
    unstable_rethrow(error);
    return (
      <Card className="v2-today-insight">
        <h3>Your last workout couldn’t load.</h3>
        <p className="v2-muted" role="alert">
          Try again to see your saved workout and progress.
        </p>
        <RetryButton />
      </Card>
    );
  }

  if (!workout) {
    return (
      <Card className="v2-today-insight">
        <h3>No completed workouts yet.</h3>
        <p className="v2-muted">
          Finish a workout to see your saved results and progression here.
          You can still find abandoned sessions in History.
        </p>
        <ButtonLink href="/v2/history" variant="secondary">
          View history
        </ButtonLink>
      </Card>
    );
  }

  return <CompletedWorkoutInsights workout={workout} />;
}

export function CompletedWorkoutInsights({
  workout,
}: CompletedWorkoutInsightsProps) {
  const exercises = [...workout.exercises].sort(
    (left, right) => left.position - right.position || left.id.localeCompare(right.id),
  );
  const recommendationExercise = exercises.find((exercise) => exercise.recommendation);
  const recordExercise = exercises.find((exercise) => exercise.records.length > 0);
  const loggedExercises = exercises.filter((exercise) => exercise.sets.length > 0).length;
  const loggedSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const duration = getWorkoutDurationLabel(workout);
  const resultHref = `/v2/workouts/${workout.id}`;

  return (
    <div className="v2-two-column v2-today-insights">
      <Card className="v2-today-insight">
        <p className="v2-eyebrow">Last completed workout</p>
        <h3>{workout.templateName}</h3>
        <_WorkoutSourceDate workout={workout} />
        <dl className="v2-result-metrics">
          <div><dt>Exercises logged</dt><dd>{loggedExercises}</dd></div>
          <div><dt>Sets logged</dt><dd>{loggedSets}</dd></div>
          {duration && <div><dt>Duration</dt><dd>{duration}</dd></div>}
        </dl>
        <ButtonLink href={resultHref} variant="secondary">View workout results</ButtonLink>
      </Card>

      <Card className="v2-today-insight">
        <p className="v2-eyebrow">Saved recommendation</p>
        {recommendationExercise?.recommendation ? (
          <>
            <h3>{recommendationExercise.exerciseName}</h3>
            <p className="v2-muted">
              From {workout.templateName}, based on that workout’s settings.
            </p>
            <_WorkoutSourceDate workout={workout} />
            <div className="v2-result-insights">
              <RecommendationSummary
                recommendation={recommendationExercise.recommendation}
                displayUnit={recommendationExercise.plannedWeightUnit}
                targetSets={recommendationExercise.targetSets}
                label="From this completed workout"
                variant="compact"
              />
            </div>
            <Link className="v2-text-link" href={resultHref}>See full workout context</Link>
          </>
        ) : (
          <>
            <h3>No saved recommendation.</h3>
            <p className="v2-muted">
              This workout doesn’t have a saved progression recommendation.
              Your logged sets are available in its results.
            </p>
          </>
        )}
      </Card>

      {recordExercise && (
        <Card className="v2-today-insight v2-today-records">
          <p className="v2-eyebrow">Records from this workout</p>
          <h3>{recordExercise.exerciseName}</h3>
          <p className="v2-muted">Saved after {workout.templateName}.</p>
          <_WorkoutSourceDate workout={workout} />
          <div className="v2-result-insights">
            <StrengthRecordSummary
              records={recordExercise.records}
              displayUnit={recordExercise.plannedWeightUnit}
            />
          </div>
          <Link className="v2-text-link" href={resultHref}>See all workout records</Link>
        </Card>
      )}
    </div>
  );
}

function _WorkoutSourceDate({ workout }: CompletedWorkoutInsightsProps) {
  return (
    <p className="v2-muted v2-insight-date">
      {workout.completedAt ? (
        <>Finished <LocalDateTime value={workout.completedAt} dateStyle="medium" /></>
      ) : (
        <>Completion time unavailable. Started <LocalDateTime value={workout.startedAt} dateStyle="medium" /></>
      )}
    </p>
  );
}
