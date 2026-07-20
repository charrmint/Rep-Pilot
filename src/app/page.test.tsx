import { render, screen } from "@testing-library/react";

import Home from "./page";

describe("Home", () => {
  it("renders the RepPilot placeholder", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "RepPilot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Log the workout. Know what to do next."),
    ).toBeInTheDocument();
  });
});
