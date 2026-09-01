import { provisionDemoDataRows } from "./demo-queries";
import { provisionDemoData } from "./demo-service";

vi.mock("./demo-queries", () => ({
  provisionDemoDataRows: vi.fn(),
}));

describe("provisionDemoData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provisions data for an anonymous demo user", async () => {
    await provisionDemoData({ isAnonymous: true });

    expect(provisionDemoDataRows).toHaveBeenCalledOnce();
  });

  it("rejects permanent users", async () => {
    await expect(
      provisionDemoData({ isAnonymous: false }),
    ).rejects.toThrow("Demo data is only available in a demo session.");
    expect(provisionDemoDataRows).not.toHaveBeenCalled();
  });
});
