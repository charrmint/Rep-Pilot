import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PersistedStrengthRecord, StrengthRecordType } from "../types";
import { StrengthRecordSummary } from "./strength-record-summary";

function record(
  overrides: Partial<PersistedStrengthRecord> & {
    type: StrengthRecordType;
    value: number;
  },
): PersistedStrengthRecord {
  const { type, value, ...rest } = overrides;

  return {
    id: `${type}-id`,
    userId: "user-id",
    workoutSessionExerciseId: "session-exercise-id",
    type,
    value,
    valueUnit: type === "highest_volume" ? "lb_reps" : "lb",
    exerciseId: "exercise-id",
    workoutSessionId: "session-id",
    previousRecordId: null,
    performedAt: "2026-09-01T17:00:00.000Z",
    createdAt: "2026-09-01T17:00:00.000Z",
    ...rest,
  };
}

describe("StrengthRecordSummary", () => {
  it("renders records in a stable product order", () => {
    render(
      <StrengthRecordSummary
        displayUnit="lb"
        records={[
          record({ type: "highest_volume", value: 4500 }),
          record({ type: "highest_weight", value: 185 }),
          record({ type: "highest_estimated_one_rep_max", value: 230 }),
        ]}
      />,
    );

    const records = within(
      screen.getByRole("region", { name: "Strength records" }),
    ).getAllByRole("term");

    expect(records.map((item) => item.textContent)).toEqual([
      "Heaviest weight",
      "Estimated 1RM",
      "Session volume",
    ]);
  });

  it("shows baseline text when there is no previous record", () => {
    render(
      <StrengthRecordSummary
        displayUnit="lb"
        records={[record({ type: "highest_weight", value: 185 })]}
      />,
    );

    expect(screen.getByText("185 lb")).toBeInTheDocument();
    expect(screen.getByText("Baseline established")).toBeInTheDocument();
    expect(screen.queryByText(/PR/i)).not.toBeInTheDocument();
  });

  it("shows concise improvement context when a previous record exists", () => {
    render(
      <StrengthRecordSummary
        displayUnit="lb"
        records={[
          record({
            type: "highest_weight",
            value: 185,
            previousRecordId: "previous-record-id",
            previousRecord: {
              type: "highest_weight",
              value: 175,
              valueUnit: "lb",
              exerciseId: "exercise-id",
              workoutSessionId: "previous-session-id",
              performedAt: "2026-08-25T17:00:00.000Z",
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("+10 lb from 175 lb")).toBeInTheDocument();
  });

  it("converts canonical pounds and pound-reps for kilogram display", () => {
    render(
      <StrengthRecordSummary
        displayUnit="kg"
        records={[
          record({
            type: "highest_estimated_one_rep_max",
            value: 220,
            previousRecordId: "previous-one-rep-max-id",
            previousRecord: {
              type: "highest_estimated_one_rep_max",
              value: 209,
              valueUnit: "lb",
              exerciseId: "exercise-id",
              workoutSessionId: "previous-session-id",
              performedAt: "2026-08-25T17:00:00.000Z",
            },
          }),
          record({
            type: "highest_volume",
            value: 4400,
            previousRecordId: "previous-volume-id",
            previousRecord: {
              type: "highest_volume",
              value: 4180,
              valueUnit: "lb_reps",
              exerciseId: "exercise-id",
              workoutSessionId: "previous-session-id",
              performedAt: "2026-08-25T17:00:00.000Z",
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("100 kg")).toBeInTheDocument();
    expect(screen.getByText("+5 kg from 95 kg")).toBeInTheDocument();
    expect(screen.getByText("2,000 kg·reps")).toBeInTheDocument();
    expect(screen.getByText("+100 kg·reps from 1,900 kg·reps")).toBeInTheDocument();
  });

  it("renders nothing for an empty record list", () => {
    const { container } = render(
      <StrengthRecordSummary displayUnit="lb" records={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
