import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

const location = vi.hoisted(() => ({ pathname: "/v2/library/exercises" }));
vi.mock("next/navigation", () => ({ usePathname: () => location.pathname }));
afterEach(cleanup);

describe("V2 navigation", () => {
  it("keeps Library selected for nested routes in both navigation layouts", () => {
    render(
      <AppShell email={null} signedIn activeWorkout={null}>
        <h1>Exercises</h1>
      </AppShell>,
    );
    for (const navigation of screen.getAllByRole("navigation")) {
      expect(
        within(navigation).getByRole("link", { name: "Library" }),
      ).toHaveAttribute("aria-current", "page");
      expect(
        within(navigation).getByRole("link", { name: "Today" }),
      ).not.toHaveAttribute("aria-current");
    }
  });

  it("offers resume only when an actual active workout exists", () => {
    const props = { email: null, signedIn: true, children: <h1>Today</h1> };
    const { rerender } = render(<AppShell {...props} activeWorkout={null} />);
    expect(
      screen.queryByRole("link", { name: /Resume workout/ }),
    ).not.toBeInTheDocument();
    rerender(
      <AppShell
        {...props}
        activeWorkout={{
          id: "session-1",
          templateName: "Upper strength",
          startedAt: "2026-09-24T12:00:00Z",
        }}
      />,
    );
    expect(
      screen.getByRole("link", { name: /Resume workout/ }),
    ).toHaveAttribute("href", "/workouts/session-1");
  });
});
