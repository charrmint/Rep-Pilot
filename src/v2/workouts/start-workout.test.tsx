import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StartWorkout } from "./start-workout";
import { startV2Workout } from "./actions";

vi.mock("./actions", () => ({ startV2Workout: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

it("requires explicit confirmation before replacing an active workout", () => {
  render(
    <StartWorkout
      templateId="plan"
      hasExercises
      activeWorkout={{
        id: "active",
        templateName: "Upper",
        startedAt: "2026-09-24",
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Start workout" }));
  expect(startV2Workout).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Resume current" })).toHaveAttribute(
    "href",
    "/v2/workouts/active",
  );
  fireEvent.click(screen.getByRole("button", { name: "Abandon and start" }));
  expect(startV2Workout).toHaveBeenCalledWith({
    templateId: "plan",
    activeSessionIdToCancel: "active",
  });
});

it("prevents a blind retry after an uncertain start failure", async () => {
  vi.mocked(startV2Workout).mockRejectedValue(new Error("timeout"));
  render(<StartWorkout templateId="plan" hasExercises activeWorkout={null} />);
  fireEvent.click(screen.getByRole("button", { name: "Start workout" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Refresh"),
  );
  await waitFor(() => expect(screen.getByRole("button", { name: "Start workout" })).toBeDisabled());
});


it("disables an already-open replacement confirmation when status becomes unavailable", () => {
  const props = { templateId: "plan", hasExercises: true, activeWorkout: { id: "active", templateName: "Upper", startedAt: "2026-09-24" } };
  const { rerender } = render(<StartWorkout {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Start workout" }));
  rerender(<StartWorkout {...props} activeWorkoutUnavailable />);
  const button = screen.getByRole("button", { name: "Abandon and start" });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(startV2Workout).not.toHaveBeenCalled();
});
