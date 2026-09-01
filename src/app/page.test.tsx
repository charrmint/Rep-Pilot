import { render, screen } from "@testing-library/react";

import Home from "./page";

describe("Home", () => {
  it("renders one clear entry point", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "RepPilot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Log the workout. Know what to do next."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start demo" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: "Sign in" }),
    ).toHaveAttribute("href", "/login");
  });
});
