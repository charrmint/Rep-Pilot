import { render, screen } from "@testing-library/react";

import Home from "./page";

describe("Home", () => {
  it("renders one clear entry point", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Track your strength training." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create plans, log sets, and review your progress."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start demo" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: "Sign in or create an account" }),
    ).toHaveAttribute("href", "/login");
  });
});
