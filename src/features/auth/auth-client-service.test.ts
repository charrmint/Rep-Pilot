import { AuthApiError } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  requestPasswordReset,
  resetPassword,
  signUpWithPassword,
} from "./auth-client-service";

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: vi.fn(),
}));

const auth = {
  resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
};
const input = {
  userId: "account-id",
  password: "a-unique-new-password",
  confirmation: "a-unique-new-password",
};

describe("password recovery service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(createSupabaseBrowserClient).mockReturnValue({
      auth,
    } as unknown as ReturnType<typeof createSupabaseBrowserClient>);
    auth.getUser.mockResolvedValue({
      data: { user: { id: "account-id", is_anonymous: false } },
      error: null,
    });
    auth.updateUser.mockResolvedValue({ error: null });
    auth.signOut.mockResolvedValue({ error: null });
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("requests recovery through the fixed callback without exposing account existence", async () => {
    await expect(
      requestPasswordReset(" visitor@example.com "),
    ).resolves.toBeUndefined();
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "visitor@example.com",
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      },
    );
  });

  it("routes signup confirmation through the code exchange", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    expect(
      await signUpWithPassword({
        email: "visitor@example.com",
        password: "password",
      }),
    ).toEqual({ hasSession: false });
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      }),
    );
  });

  it("provides retry guidance for rate limiting without leaking provider details", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({
      error: new AuthApiError(
        "internal detail",
        429,
        "over_email_send_rate_limit",
      ),
    });
    await expect(requestPasswordReset("visitor@example.com")).rejects.toThrow(
      "Please wait",
    );
  });

  it("validates password confirmation before calling auth", async () => {
    await expect(
      resetPassword({ ...input, confirmation: "different" }),
    ).rejects.toThrow("do not match");
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(auth.getUser).not.toHaveBeenCalled();
  });

  it("rejects short passwords", async () => {
    await expect(
      resetPassword({ ...input, password: "short", confirmation: "short" }),
    ).rejects.toThrow("at least 6");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it.each([
    { data: { user: null }, error: null },
    { data: { user: { id: "account-id", is_anonymous: true } }, error: null },
    {
      data: { user: null },
      error: new AuthApiError("expired", 400, "session_expired"),
    },
  ])("rejects an absent, anonymous, or expired session", async (result) => {
    auth.getUser.mockResolvedValue(result);
    await expect(resetPassword(input)).rejects.toThrow(
      "reset session has expired",
    );
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("does not change another account after a session switch", async () => {
    auth.getUser.mockResolvedValue({
      data: { user: { id: "other-account", is_anonymous: false } },
      error: null,
    });
    await expect(resetPassword(input)).rejects.toThrow("account has changed");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("distinguishes an auth outage from an expired session", async () => {
    auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthApiError("unavailable", 503, undefined),
    });
    await expect(resetPassword(input)).rejects.toThrow(
      "Unable to check your session",
    );
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("updates the password before requesting global sign-out", async () => {
    expect(await resetPassword(input)).toEqual({ signedOut: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: input.password });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(auth.updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      auth.signOut.mock.invocationCallOrder[0],
    );
  });

  it("does not sign out after a rejected password", async () => {
    auth.updateUser.mockResolvedValue({
      error: new AuthApiError("same", 422, "same_password"),
    });
    await expect(resetPassword(input)).rejects.toThrow(
      "different from your current",
    );
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it.each(["returned", "thrown"])(
    "reports a successful update when sign-out fails (%s)",
    async (failure) => {
      if (failure === "returned")
        auth.signOut.mockResolvedValue({
          error: new AuthApiError("unavailable", 503, undefined),
        });
      else auth.signOut.mockRejectedValue(new Error("offline"));
      expect(await resetPassword(input)).toEqual({ signedOut: false });
      expect(auth.updateUser).toHaveBeenCalledOnce();
    },
  );
});
