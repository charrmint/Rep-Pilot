import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import LoginScreen from "./login-screen";
import { LandingScreen } from "../public/landing-screen";
vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("@/features/auth/auth-server-service", () => ({ getCurrentUser: vi.fn() }));
vi.mock("./login-form", () => ({ LoginForm: () => <form aria-label="Account form" /> }));
vi.mock("@/features/demo/demo-entry-form", () => ({ DemoEntryForm: () => <form aria-label="Demo form" /> }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
it("preserves the signed-in redirect while allowing confirmation failure feedback", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "owner", is_anonymous: false } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>);
  await expect(LoginScreen({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/templates");
  render(await LoginScreen({ searchParams: Promise.resolve({ error: "invalid_link" }) }));
  expect(screen.getByRole("alert")).toHaveTextContent("same browser and device");
});
it("lets demo users access the account form and shows password-reset success", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "demo", is_anonymous: true } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>);
  render(await LoginScreen({ searchParams: Promise.resolve({ status: "password_reset" }) }));
  expect(screen.getByRole("status")).toHaveTextContent("Password updated");
  expect(screen.getByRole("form", { name: "Account form" }).compareDocumentPosition(screen.getByRole("form", { name: "Demo form" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
it("introduces the product with clearly labeled example data and shared auth links", () => {
  render(<LandingScreen />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Track your strength training.");
  expect(screen.getByText("Example workout")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in or create an account" })).toHaveAttribute("href", "/login");
  expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#public-content");
});
