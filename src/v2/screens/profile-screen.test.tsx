import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getV2Context } from "../server/context";
import { ProfileScreen } from "./profile-screen";
import type { V2Context } from "../server/types";

vi.mock("../server/context", () => ({ getV2Context: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/features/auth/auth-client-service", () => ({ signOut: vi.fn() }));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

function _user(email: string | undefined, is_anonymous = false) {
  return { id: "owner", email, is_anonymous } as NonNullable<V2Context["user"]>;
}
async function _render(user: V2Context["user"]) {
  vi.mocked(getV2Context).mockResolvedValue({ user, activeWorkout: null, activeWorkoutUnavailable: false });
  render(await ProfileScreen());
}

it("shows guest entry points without account actions or settings", async () => {
  await _render(null);
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  expect(screen.getByRole("link", { name: "Explore demo" })).toHaveAttribute("href", "/");
  expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Reset password" })).not.toBeInTheDocument();
});
it("shows account identity and accurately describes email recovery and global sign-out", async () => {
  await _render(_user("owner@example.com"));
  expect(screen.getByRole("heading", { name: "owner@example.com" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Reset password" })).toHaveAttribute("href", "/forgot-password");
  expect(screen.getByText(/Request a reset email/)).toBeInTheDocument();
  expect(screen.getByText(/on all devices/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  expect(screen.getByRole("link", { name: "Open classic app" })).toHaveAttribute("href", "/templates");
  expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});
it.each([undefined, "demo@example.com"])("keeps demo identity and hides unsupported recovery even with email %s", async (email) => {
  await _render(_user(email, true));
  expect(screen.getByRole("heading", { name: "Training in demo mode" })).toBeInTheDocument();
  expect(screen.getByText("Demo account")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  expect(screen.queryByRole("link", { name: "Reset password" })).not.toBeInTheDocument();
});
it("does not mislabel an account without email as a demo", async () => {
  await _render(_user(undefined));
  expect(screen.getByRole("heading", { name: "Your account" })).toBeInTheDocument();
  expect(screen.queryByText("Demo account")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Reset password" })).not.toBeInTheDocument();
});
