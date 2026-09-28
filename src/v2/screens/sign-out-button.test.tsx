import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { signOut } from "@/features/auth/auth-client-service";
import { SignOutButton } from "./sign-out-button";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/features/auth/auth-client-service", () => ({ signOut: vi.fn() }));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

it("locks pending sign-out and refreshes identity only after success", async () => {
  let finish!: () => void;
  vi.mocked(signOut).mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
  render(<SignOutButton />);
  const button = screen.getByRole("button", { name: "Sign out" });
  act(() => { button.click(); button.click(); });
  expect(signOut).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Signing out…" })).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(router.replace).not.toHaveBeenCalled();
  await act(async () => finish());
  expect(router.replace).toHaveBeenCalledWith("/v2");
  expect(router.refresh).toHaveBeenCalledOnce();
});
it("keeps account access on failure and allows a successful retry", async () => {
  vi.mocked(signOut).mockRejectedValueOnce(new Error("private provider detail")).mockResolvedValueOnce(undefined);
  render(<SignOutButton />);
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign out. Please try again."));
  expect(screen.queryByText("private provider detail")).not.toBeInTheDocument();
  expect(router.replace).not.toHaveBeenCalled();
  expect(router.refresh).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
  expect(signOut).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
