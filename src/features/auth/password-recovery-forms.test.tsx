import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { requestPasswordReset, signOut } from "./auth-client-service";
import { resetPassword } from "./password-recovery-actions";
import { ForgotPasswordForm } from "./forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";
import { LogoutButton } from "./logout-button";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("./auth-client-service", () => ({
  requestPasswordReset: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("./password-recovery-actions", () => ({ resetPassword: vi.fn() }));

function _fillPasswordForm() {
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "new-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "new-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
}

describe("password recovery forms", () => {
  beforeEach(() => vi.resetAllMocks());

  it("announces a neutral email confirmation and same-browser instructions", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue();
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset email" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If an account exists",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "this browser on this device",
    );
  });

  it("announces request failure and allows retry", async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue(
      new Error("Please wait before requesting another reset email."),
    );
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset email" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please wait");
    expect(
      screen.getByRole("button", { name: "Send reset email" }),
    ).toBeEnabled();
  });

  it("returns to sign in after updating and signing out", async () => {
    vi.mocked(resetPassword).mockResolvedValue({ signedOut: true });
    render(<ResetPasswordForm email="person@example.com" userId="user-id" />);
    _fillPasswordForm();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        "/login?status=password_reset",
      ),
    );
    expect(resetPassword).toHaveBeenCalledWith({
      userId: "user-id",
      password: "new-password",
      confirmation: "new-password",
    });
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("offers a new email after session expiry without navigating away", async () => {
    vi.mocked(resetPassword).mockResolvedValue({
      error: "Your reset session has expired. Request a new reset email.",
    });
    render(<ResetPasswordForm email="person@example.com" userId="user-id" />);
    _fillPasswordForm();
    expect(await screen.findByRole("alert")).toHaveTextContent("expired");
    expect(
      screen.getByRole("link", { name: "Request a new reset email" }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("retries sign-out without repeating a successful password update", async () => {
    vi.mocked(resetPassword).mockResolvedValue({ signedOut: false });
    vi.mocked(signOut).mockResolvedValue();
    render(<ResetPasswordForm email="person@example.com" userId="user-id" />);
    _fillPasswordForm();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "password has been updated",
    );
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry sign out" }));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        "/login?status=password_reset",
      ),
    );
    expect(resetPassword).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("keeps the user on the page when ordinary sign-out fails", async () => {
    vi.mocked(signOut).mockRejectedValue(new Error("offline"));
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to sign out",
    );
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  });
});
