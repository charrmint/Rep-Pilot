import {
  insertDemoProgressionRecommendationRows,
  listDemoCompletedProgressionExerciseRows,
  provisionDemoDataRows,
  provisionDemoStrengthRecordBaselinesRows,
} from "./demo-queries";
import { provisionDemoData } from "./demo-service";

vi.mock("./demo-queries", () => ({
  insertDemoProgressionRecommendationRows: vi.fn(),
  listDemoCompletedProgressionExerciseRows: vi.fn(),
  provisionDemoDataRows: vi.fn(),
  provisionDemoStrengthRecordBaselinesRows: vi.fn(),
}));

describe("provisionDemoData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(listDemoCompletedProgressionExerciseRows).mockResolvedValue([]);
  });

  it("provisions data for an anonymous demo user", async () => {
    await provisionDemoData({ userId: "demo-user-id", isAnonymous: true });

    expect(provisionDemoDataRows).toHaveBeenCalledOnce();
    expect(listDemoCompletedProgressionExerciseRows).toHaveBeenCalledWith(
      "demo-user-id",
    );
    expect(insertDemoProgressionRecommendationRows).toHaveBeenCalledWith({
      userId: "demo-user-id",
      recommendations: [],
    });
    expect(provisionDemoStrengthRecordBaselinesRows).toHaveBeenCalledOnce();
    expect(
      vi.mocked(provisionDemoDataRows).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(provisionDemoStrengthRecordBaselinesRows).mock
        .invocationCallOrder[0],
    );
    expect(
      vi.mocked(insertDemoProgressionRecommendationRows).mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(provisionDemoStrengthRecordBaselinesRows).mock
        .invocationCallOrder[0],
    );
  });

  it("rejects permanent users", async () => {
    await expect(
      provisionDemoData({ userId: "permanent-user-id", isAnonymous: false }),
    ).rejects.toThrow("Demo data is only available in a demo session.");
    expect(provisionDemoDataRows).not.toHaveBeenCalled();
    expect(provisionDemoStrengthRecordBaselinesRows).not.toHaveBeenCalled();
  });

  it("does not provision strength baselines when primary demo seed fails", async () => {
    vi.mocked(provisionDemoDataRows).mockRejectedValue(
      new Error("Failed to prepare demo data: unavailable"),
    );

    await expect(
      provisionDemoData({ userId: "demo-user-id", isAnonymous: true }),
    ).rejects.toThrow("Failed to prepare demo data: unavailable");
    expect(listDemoCompletedProgressionExerciseRows).not.toHaveBeenCalled();
    expect(insertDemoProgressionRecommendationRows).not.toHaveBeenCalled();
    expect(provisionDemoStrengthRecordBaselinesRows).not.toHaveBeenCalled();
  });

  it("surfaces strength baseline provisioning failures", async () => {
    vi.mocked(provisionDemoStrengthRecordBaselinesRows).mockRejectedValue(
      new Error("Failed to prepare demo strength record baselines: unavailable"),
    );

    await expect(
      provisionDemoData({ userId: "demo-user-id", isAnonymous: true }),
    ).rejects.toThrow(
      "Failed to prepare demo strength record baselines: unavailable",
    );
  });
});
