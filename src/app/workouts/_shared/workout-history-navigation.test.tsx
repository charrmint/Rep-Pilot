import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkoutHistoryNavigation } from "./workout-history-navigation";

describe("WorkoutHistoryNavigation", () => {
  it("links all history lenses and marks the active view", () => {
    render(<WorkoutHistoryNavigation activeView="templates" />);

    expect(screen.getByRole("link", { name: "Recent" })).toHaveAttribute(
      "href",
      "/workouts",
    );
    expect(screen.getByRole("link", { name: "Templates" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Exercises" })).toHaveAttribute(
      "href",
      "/workouts/exercises",
    );
  });
});
