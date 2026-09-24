// @vitest-environment node
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPasswordRecoveryUser } from "./password-recovery-service";
import { handleAuthCallback } from "./auth-callback";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("./password-recovery-service", () => ({
  getPasswordRecoveryUser: vi.fn(),
}));
const exchangeCodeForSession = vi.fn();

function _request(query: string) {
  return new Request(`https://rep-pilot.example/auth/callback${query}`);
}

describe("auth callback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getPasswordRecoveryUser).mockResolvedValue({
      id: "user-id",
    } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
    exchangeCodeForSession.mockResolvedValue({
      data: { session: {}, user: { is_anonymous: false } },
      error: null,
    });
  });

  it("exchanges a recovery code and removes credentials from the destination", async () => {
    const response = await handleAuthCallback(
      _request("?code=secret&next=/reset-password"),
    );
    expect(exchangeCodeForSession).toHaveBeenCalledWith("secret");
    expect(response.headers.get("location")).toBe(
      "https://rep-pilot.example/reset-password",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("rejects a normal login code relabeled as recovery", async () => {
    vi.mocked(getPasswordRecoveryUser).mockResolvedValue(null);
    const response = await handleAuthCallback(
      _request("?code=login-code&next=/reset-password"),
    );
    expect(response.headers.get("location")).toBe(
      "https://rep-pilot.example/forgot-password?error=invalid_link",
    );
  });

  it.each([
    "",
    "&next=https://evil.example",
    "&next=//evil.example",
    "&next=/\\evil.example",
  ])("keeps signup and untrusted destinations local (%s)", async (next) => {
    const response = await handleAuthCallback(_request(`?code=secret${next}`));
    expect(response.headers.get("location")).toBe(
      "https://rep-pilot.example/templates",
    );
  });

  it.each([
    "?next=/reset-password",
    "?next=/reset-password&error=access_denied&code=secret",
  ])("does not exchange a missing or failed code", async (query) => {
    const response = await handleAuthCallback(_request(query));
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://rep-pilot.example/forgot-password?error=invalid_link",
    );
  });

  it("offers a new reset email for an expired, replayed, or wrong-browser code", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {},
      error: { message: "sensitive provider detail" },
    });
    const response = await handleAuthCallback(
      _request("?code=secret&next=/reset-password"),
    );
    expect(response.headers.get("location")).toBe(
      "https://rep-pilot.example/forgot-password?error=invalid_link",
    );
  });

  it("handles a failed confirmation without forwarding raw errors", async () => {
    exchangeCodeForSession.mockRejectedValue(
      new Error("sensitive provider detail"),
    );
    const response = await handleAuthCallback(_request("?code=secret"));
    expect(response.headers.get("location")).toBe(
      "https://rep-pilot.example/login?error=invalid_link",
    );
  });
});
