import {
  provisionDemoDataRows,
  provisionDemoStrengthRecordBaselinesRows,
} from "./demo-queries";
import { provisionDemoData } from "./demo-service";

vi.mock("./demo-queries", () => ({
  provisionDemoDataRows: vi.fn(),
  provisionDemoStrengthRecordBaselinesRows: vi.fn(),
}));

describe("provisionDemoData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("provisions data for an anonymous demo user", async () => {
    await provisionDemoData({ isAnonymous: true });

    expect(provisionDemoDataRows).toHaveBeenCalledOnce();
    expect(provisionDemoStrengthRecordBaselinesRows).toHaveBeenCalledOnce();
    expect(
      vi.mocked(provisionDemoDataRows).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(provisionDemoStrengthRecordBaselinesRows).mock
        .invocationCallOrder[0],
    );
  });

  it("rejects permanent users", async () => {
    await expect(
      provisionDemoData({ isAnonymous: false }),
    ).rejects.toThrow("Demo data is only available in a demo session.");
    expect(provisionDemoDataRows).not.toHaveBeenCalled();
    expect(provisionDemoStrengthRecordBaselinesRows).not.toHaveBeenCalled();
  });

  it("does not provision strength baselines when primary demo seed fails", async () => {
    vi.mocked(provisionDemoDataRows).mockRejectedValue(
      new Error("Failed to prepare demo data: unavailable"),
    );

    await expect(provisionDemoData({ isAnonymous: true })).rejects.toThrow(
      "Failed to prepare demo data: unavailable",
    );
    expect(provisionDemoStrengthRecordBaselinesRows).not.toHaveBeenCalled();
  });

  it("surfaces strength baseline provisioning failures", async () => {
    vi.mocked(provisionDemoStrengthRecordBaselinesRows).mockRejectedValue(
      new Error("Failed to prepare demo strength record baselines: unavailable"),
    );

    await expect(provisionDemoData({ isAnonymous: true })).rejects.toThrow(
      "Failed to prepare demo strength record baselines: unavailable",
    );
  });
});
