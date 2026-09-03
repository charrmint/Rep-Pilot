import {
  provisionDemoDataRows,
  provisionDemoStrengthRecordBaselinesRows,
} from "./demo-queries";
import type { DemoUserIdentity } from "./types";

export async function provisionDemoData(
  identity: DemoUserIdentity,
): Promise<void> {
  if (!identity.isAnonymous) {
    throw new Error("Demo data is only available in a demo session.");
  }

  await provisionDemoDataRows();
  await provisionDemoStrengthRecordBaselinesRows();
}
