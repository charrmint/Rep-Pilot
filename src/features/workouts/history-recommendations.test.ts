import { beforeEach, expect, it, vi } from "vitest";
import { listProgressionRecommendationRows } from "../progression/progression-queries";
import { getHistoryRecommendations } from "./history-recommendations";
vi.mock("../progression/progression-queries", () => ({ listProgressionRecommendationRows: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
it("loads saved decisions in one owner-scoped batch keyed by session exercise", async () => {
  vi.mocked(listProgressionRecommendationRows).mockResolvedValue([{
    id: "recorded", user_id: "owner", workout_session_exercise_id: "entry", action: "maintain", reason: "within_rep_range", recommended_weight_lbs: 100, recommended_min_reps: 8, recommended_max_reps: 12, recommended_rir: 2, explanation: "Recorded explanation", engine_version: "old_engine", input_snapshot: {}, created_at: "2026-09-28T12:00:00Z",
  }]);
  const result = await getHistoryRecommendations("owner", ["entry", "entry", "other"]);
  expect(listProgressionRecommendationRows).toHaveBeenCalledExactlyOnceWith({ userId: "owner", sessionExerciseIds: ["entry", "other"] });
  expect(result.entry).toMatchObject({ id: "recorded", recommendedWeightLbs: 100, engineVersion: "old_engine", explanation: "Recorded explanation" });
  expect(result.other).toBeUndefined();
});
it("avoids an empty query and propagates load failures", async () => {
  expect(await getHistoryRecommendations("owner", [])).toEqual({});
  expect(listProgressionRecommendationRows).not.toHaveBeenCalled();
  vi.mocked(listProgressionRecommendationRows).mockRejectedValue(new Error("offline"));
  await expect(getHistoryRecommendations("owner", ["entry"])).rejects.toThrow("offline");
});
