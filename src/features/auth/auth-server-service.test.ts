import { AuthApiError, AuthSessionMissingError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth-server-service";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
const getUser = vi.fn();

describe("current user", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser },
    } as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
  });

  it.each([
    new AuthSessionMissingError(),
    ...[
      "session_not_found",
      "session_expired",
      "refresh_token_not_found",
      "refresh_token_already_used",
      "bad_jwt",
      "user_not_found",
    ].map((code) => new AuthApiError("invalid session", 401, code)),
  ])("treats invalid credentials as signed out", async (error) => {
    getUser.mockResolvedValue({ data: { user: null }, error });
    expect(await getCurrentUser()).toBeNull();
  });

  it("keeps service failures distinct from signed-out state", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthApiError("internal detail", 503, undefined),
    });
    await expect(getCurrentUser()).rejects.toThrow(
      "Unable to check your session",
    );
  });

  it("returns the verified user", async () => {
    const user = { id: "user-id" };
    getUser.mockResolvedValue({ data: { user }, error: null });
    expect(await getCurrentUser()).toEqual(user);
  });
});
