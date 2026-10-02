import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { signInWithPassword, signUpWithPassword } from "@/features/auth/auth-client-service";
import { LoginForm } from "./login-form";
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/features/auth/auth-client-service", () => ({ signInWithPassword: vi.fn(), signUpWithPassword: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
function _fill() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "person@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
}
it("keeps the existing sign-in destination and password-manager semantics", async () => {
  vi.mocked(signInWithPassword).mockResolvedValue();
  render(<LoginForm />); _fill();
  expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
  fireEvent.submit(screen.getByRole("form"));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/templates"));
  expect(signInWithPassword).toHaveBeenCalledWith({ email: "person@example.com", password: "password123" });
  expect(router.refresh).toHaveBeenCalledOnce();
});
it.each([true, false])("handles signup with session=%s", async hasSession => {
  vi.mocked(signUpWithPassword).mockResolvedValue({ hasSession });
  render(<LoginForm />);
  fireEvent.click(screen.getByRole("button", { name: "Create account" })); _fill();
  expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
  fireEvent.submit(screen.getByRole("form"));
  if (hasSession) await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/templates"));
  else {
    expect(await screen.findByRole("status")).toHaveTextContent("Confirm your email");
    expect(router.replace).not.toHaveBeenCalled();
  }
});
it("retains input on failure and clears stale feedback when modes change", async () => {
  vi.mocked(signInWithPassword).mockRejectedValue(new Error("Invalid credentials"));
  render(<LoginForm />); _fill(); fireEvent.submit(screen.getByRole("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  expect(screen.getByLabelText("Email")).toHaveValue("person@example.com");
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(router.replace).not.toHaveBeenCalled();
});
it("blocks repeated submissions and mode changes while authentication is pending", async () => {
  let finish!: () => void;
  vi.mocked(signInWithPassword).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<LoginForm />); _fill();
  fireEvent.submit(screen.getByRole("form")); fireEvent.submit(screen.getByRole("form"));
  expect(signInWithPassword).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
  expect(screen.getByLabelText("Email")).toBeDisabled();
  finish(); await waitFor(() => expect(router.replace).toHaveBeenCalled());
});
