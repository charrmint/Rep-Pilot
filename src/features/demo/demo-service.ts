import {
  insertDemoProgressionRecommendationRows,
  listDemoCompletedProgressionExerciseRows,
  provisionDemoDataRows,
  provisionDemoStrengthRecordBaselinesRows,
} from "./demo-queries";
import { prepareDemoProgressionRecommendations } from "./demo-progression";
import type { DemoUserIdentity } from "./types";

export async function provisionDemoData(
  identity: DemoUserIdentity,
): Promise<void> {
  if (!identity.isAnonymous) {
    throw new Error("Demo data is only available in a demo session.");
  }

  await provisionDemoDataRows();
  const progressionExerciseRows =
    await listDemoCompletedProgressionExerciseRows(identity.userId);
  const recommendations = prepareDemoProgressionRecommendations(
    progressionExerciseRows,
  );
  await insertDemoProgressionRecommendationRows({
    userId: identity.userId,
    recommendations,
  });
  await provisionDemoStrengthRecordBaselinesRows();
}
