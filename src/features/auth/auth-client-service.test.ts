import { AuthApiError } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  requestPasswordReset,
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
});
